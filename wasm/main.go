package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
	"syscall/js"
	"embed"

	"github.com/wowsims/classic/sim"
	"github.com/wowsims/classic/sim/core"
	"github.com/wowsims/classic/sim/core/proto"
)

//go:embed data/*
var embeddedData embed.FS


type specJob struct {
	id             string
	class          proto.Class
	races          []string
	talents        string
	fallback       string
	talentSource   string
	gearDir        string
	gearFile       string
	aplDir         string
	aplFile        string
	specOptions    interface{}
	consumes       *proto.Consumes
	isTank         bool
	isHealer       bool
	distance       float64
	lockWeapons    bool
}

type resultRow struct {
	SpecID       string  `json:"specId"`
	RaceID       string  `json:"raceId"`
	Dps          float64 `json:"dps"`
	Hps          float64 `json:"hps"`
	Stdev        float64 `json:"stdev"`
	Iterations   int32   `json:"iterations"`
	Seed         int32   `json:"seed"`
	Talents      string  `json:"talents"`
	TalentSource string  `json:"talentSource"`
	Weapon       string      `json:"weapon,omitempty"`
	GearSet      string      `json:"gearSet,omitempty"`
	Gear         []gearPiece `json:"gear,omitempty"`
	Error        string      `json:"error,omitempty"`
}

type resultFile struct {
	Engine            string      `json:"engine"`
	EngineURL         string      `json:"engineUrl"`
	License           string      `json:"license"`
	FightDurationSec  float64     `json:"fightDurationSec"`
	Iterations        int32       `json:"iterations"`
	Seed              int32       `json:"seed"`
	MobType           string      `json:"mobType"`
	GeneratedAt       string      `json:"generatedAt"`
	Rows              []resultRow `json:"rows"`
}

var races = map[string]proto.Race{
	"orc":         proto.Race_RaceOrc,
	"undead":      proto.Race_RaceUndead,
	"tauren":      proto.Race_RaceTauren,
	"troll":       proto.Race_RaceTroll,
	"windshaper":  proto.Race_RaceSkyborneWindshaper,
	"human":       proto.Race_RaceHuman,
	"dwarf":       proto.Race_RaceDwarf,
	"nightelf":    proto.Race_RaceNightElf,
	"gnome":       proto.Race_RaceGnome,
	"highorder":   proto.Race_RaceSkyborneHighOrder,
}


func embedDir(dir string) string {
	return strings.TrimPrefix(dir, "ui/")
}

func getAplRotation(dir string, file string) core.RotationCombo {
	filePath := "data/" + embedDir(dir) + "/" + file + ".apl.json"
	data, err := embeddedData.ReadFile(filePath)
	if err != nil {
		fmt.Printf("failed to load apl json file: %s, %s\n", filePath, err)
		return core.RotationCombo{}
	}
	return core.RotationCombo{Label: file, Rotation: core.APLRotationFromJsonString(string(data))}
}

func loadJobGear(job specJob) core.GearSetCombo {
	override := "data/lib-data/gear-overrides/" + job.id + ".gear.json"
	if data, err := embeddedData.ReadFile(override); err == nil {
		return core.GearSetCombo{
			Label:   "custom/" + job.id,
			GearSet: core.EquipmentSpecFromJsonString(string(data)),
		}
	}
	path := "data/lib-data/era-prebis/" + job.id + ".gear.json"
	if data, err := embeddedData.ReadFile(path); err == nil {
		return core.GearSetCombo{
			Label:   "era-prebis/" + job.id,
			GearSet: core.EquipmentSpecFromJsonString(string(data)),
		}
	}
	filePath := "data/" + embedDir(job.gearDir) + "/" + job.gearFile + ".gear.json"
	data, err := embeddedData.ReadFile(filePath)
	if err != nil || len(data) == 0 {
		fmt.Printf("failed to load gear json file: %s, %s\n", filePath, err)
		return core.GearSetCombo{Label: job.gearFile, GearSet: &proto.EquipmentSpec{}}
	}
	return core.GearSetCombo{Label: job.gearFile, GearSet: core.EquipmentSpecFromJsonString(string(data))}
}

func jsonError(message string) string {
	raw, err := json.Marshal(map[string]string{"error": message})
	if err != nil {
		return `{"error":"wasm sim failed"}`
	}
	return string(raw)
}

func runResimSpec(specId string, talents string, iters int, seed int, mobTypeStr string) (jsonStr string) {
	defer func() {
		if recovered := recover(); recovered != nil {
			jsonStr = jsonError(fmt.Sprintf("panic: %v", recovered))
		}
	}()

	if seed == 0 {
		seed = int(time.Now().UnixNano() & 0x7fffffff)
		if seed == 0 {
			seed = 1
		}
	}

	mobEnum, _ := parseMobType(mobTypeStr)
	jobs := rankedJobs()
	var targetJob *specJob
	for i := range jobs {
		if jobs[i].id == specId {
			if talents != "" {
				jobs[i].talents = talents
				jobs[i].talentSource = "custom"
				jobs[i].fallback = ""
			}
			targetJob = &jobs[i]
			break
		}
	}

	if targetJob == nil {
		return "[]"
	}

	rotation := getAplRotation(targetJob.aplDir, targetJob.aplFile)
	gear := loadJobGear(*targetJob)
	buffs := core.ForeverBuffs

	results := []resultRow{}
	for _, raceID := range targetJob.races {
		race := races[raceID]
		racialGear := core.GearSetCombo{
			Label:   gear.Label,
			GearSet: racializeGear(gear.GearSet, race, targetJob.class, targetJob.lockWeapons),
		}
		row := runCombo(*targetJob, race, raceID, racialGear, rotation, buffs, int32(iters), int32(seed), 180.0, false, mobEnum)
		row.Weapon = weaponFamilyOf(racialGear.GearSet)
		row.GearSet = gear.Label
		row.Gear = equippedPieces(racialGear.GearSet)
		results = append(results, row)
	}

	outBytes, err := json.Marshal(results)
	if err != nil {
		return jsonError(err.Error())
	}
	return string(outBytes)
}

func resimSpec(_ js.Value, args []js.Value) interface{} {
	if len(args) < 5 {
		return nil
	}
	specId := args[0].String()
	talents := args[1].String()
	iters := args[2].Int()
	seed := args[3].Int()
	mobTypeStr := args[4].String()
	callback := js.Undefined()
	if len(args) > 5 {
		callback = args[5]
	}

	go func() {
		jsonStr := runResimSpec(specId, talents, iters, seed, mobTypeStr)
		if callback.Truthy() {
			callback.Invoke(jsonStr)
		}
	}()
	return nil
}

var resimFunc js.Func

func init() {
	core.SetRunningInWasm()
}

func main() {
	c := make(chan struct{})
	sim.RegisterAll()
	resimFunc = js.FuncOf(resimSpec)
	js.Global().Set("resimSpecWasm", resimFunc)
	if ready := js.Global().Get("wasmready"); ready.Type() == js.TypeFunction {
		ready.Invoke()
	}
	<-c
}

type progressEvent struct {
	Type       string     `json:"type"`
	Index      int        `json:"index,omitempty"`
	Total      int        `json:"total,omitempty"`
	Iterations int32      `json:"iterations,omitempty"`
	Seed       int32      `json:"seed,omitempty"`
	Row        *resultRow `json:"row,omitempty"`
}

func emitSim(ev progressEvent) {
	raw, err := json.Marshal(ev)
	if err != nil {
		return
	}
	fmt.Printf("SIM %s\n", raw)
}

func comboCount(jobs []specJob, wantSpecs, wantRaces map[string]bool) int {
	n := 0
	for _, job := range jobs {
		if len(wantSpecs) > 0 && !wantSpecs[job.id] {
			continue
		}
		for _, raceID := range job.races {
			if len(wantRaces) > 0 && !wantRaces[raceID] {
				continue
			}
			n++
		}
	}
	return n
}













func parseMobType(raw string) (proto.MobType, string) {
	key := strings.ToLower(strings.TrimSpace(raw))
	if key == "" {
		key = "demon"
	}
	switch key {
	case "unknown", "none":
		return proto.MobType_MobTypeUnknown, "Unknown"
	case "beast":
		return proto.MobType_MobTypeBeast, "Beast"
	case "demon":
		return proto.MobType_MobTypeDemon, "Demon"
	case "dragonkin":
		return proto.MobType_MobTypeDragonkin, "Dragonkin"
	case "elemental":
		return proto.MobType_MobTypeElemental, "Elemental"
	case "giant":
		return proto.MobType_MobTypeGiant, "Giant"
	case "humanoid":
		return proto.MobType_MobTypeHumanoid, "Humanoid"
	case "mechanical":
		return proto.MobType_MobTypeMechanical, "Mechanical"
	case "undead":
		return proto.MobType_MobTypeUndead, "Undead"
	default:
		return proto.MobType_MobTypeDemon, "Demon"
	}
}

func targetFor(mob proto.MobType) *proto.Target {
	target := *core.NewDefaultTarget()
	target.MobType = mob
	return &target
}

func csvSet(raw string) map[string]bool {
	out := map[string]bool{}
	if strings.TrimSpace(raw) == "" {
		return out
	}
	for _, part := range strings.Split(raw, ",") {
		part = strings.TrimSpace(part)
		if part != "" {
			out[part] = true
		}
	}
	return out
}

func runCombo(
	job specJob,
	race proto.Race,
	raceID string,
	gear core.GearSetCombo,
	rotation core.RotationCombo,
	buffs core.BuffsCombo,
	iters int32,
	seed int32,
	duration float64,
	debug bool,
	mob proto.MobType,
) resultRow {
	talents := job.talents
	source := job.talentSource
	row := trySim(job, race, raceID, talents, source, gear, rotation, buffs, iters, seed, duration, debug, mob)
	if row.Error != "" && job.fallback != "" && job.fallback != talents {
		row = trySim(job, race, raceID, job.fallback, "wowsims-default", gear, rotation, buffs, iters, seed, duration, debug, mob)
	}
	return row
}

func trySim(
	job specJob,
	race proto.Race,
	raceID string,
	talents string,
	source string,
	gear core.GearSetCombo,
	rotation core.RotationCombo,
	buffs core.BuffsCombo,
	iters int32,
	seed int32,
	duration float64,
	debug bool,
	mob proto.MobType,
) (row resultRow) {
	row = resultRow{
		SpecID:       job.id,
		RaceID:       raceID,
		Iterations:   iters,
		Seed:         seed,
		Talents:      talents,
		TalentSource: source,
	}

	defer func() {
		if recovered := recover(); recovered != nil {
			row.Error = fmt.Sprintf("panic: %v", recovered)
		}
	}()

	player := playerFor(job, race, talents, gear.GearSet, rotation.Rotation, buffs)

	raid := core.SinglePlayerRaidProto(player, buffs.Party, buffs.Raid, buffs.Debuffs)
	if job.isTank {
		raid.Tanks = append(raid.Tanks, &proto.UnitReference{Type: proto.UnitReference_Player, Index: 0})
	}
	if job.isHealer {
		raid.TargetDummies = 1
	}

	request := &proto.RaidSimRequest{
		Raid: raid,
		Encounter: &proto.Encounter{
			Duration:             duration,
			ExecuteProportion_20: 0.2,
			ExecuteProportion_25: 0.25,
			ExecuteProportion_35: 0.35,
			Targets: []*proto.Target{
				targetFor(mob),
			},
		},
		SimOptions: &proto.SimOptions{
			Iterations: iters,
			RandomSeed: int64(seed),
			Debug:      debug,
			IsTest:     false,
			Ruleset:    proto.Ruleset_RulesetForever,
		},
	}

	result := core.RunRaidSim(request)
	if result.Error != nil {
		row.Error = result.Error.Message
		return row
	}
	if debug && result.Logs != "" {
		fmt.Print(result.Logs)
	}
	row.Dps = result.RaidMetrics.Dps.Avg
	row.Hps = result.RaidMetrics.Hps.Avg
	row.Stdev = result.RaidMetrics.Dps.Stdev
	return row
}

func rankedJobs() []specJob {
	warriorMelee := meleeConsumes(proto.Potions_MightyRagePotion, proto.WeaponImbue_Windfury, proto.WeaponImbue_ElementalSharpeningStone)
	casterMana := casterConsumes()
	hunterCons := hunterConsumes()
	rogueCombat := &proto.Consumes{
		AgilityElixir:   proto.AgilityElixir_ElixirOfTheMongoose,
		MainHandImbue:   proto.WeaponImbue_Windfury,
		OffHandImbue:    proto.WeaponImbue_InstantPoison,
		StrengthBuff:    proto.StrengthBuff_JujuPower,
		AttackPowerBuff: proto.AttackPowerBuff_JujuMight,
	}
	rogueMut := &proto.Consumes{
		AgilityElixir:   proto.AgilityElixir_ElixirOfTheMongoose,
		MainHandImbue:   proto.WeaponImbue_InstantPoison,
		OffHandImbue:    proto.WeaponImbue_DeadlyPoison,
		StrengthBuff:    proto.StrengthBuff_JujuPower,
		AttackPowerBuff: proto.AttackPowerBuff_JujuMight,
	}
	enhanceCons := &proto.Consumes{
		AttackPowerBuff:   proto.AttackPowerBuff_JujuMight,
		AgilityElixir:     proto.AgilityElixir_ElixirOfTheMongoose,
		DefaultConjured:   proto.Conjured_ConjuredDemonicRune,
		DefaultPotion:     proto.Potions_MajorManaPotion,
		DragonBreathChili: true,
		FirePowerBuff:     proto.FirePowerBuff_ElixirOfGreaterFirepower,
		Flask:             proto.Flask_FlaskOfSupremePower,
		Food:              proto.Food_FoodBlessSunfruit,
		MainHandImbue:     proto.WeaponImbue_WindfuryWeapon,
		OffHandImbue:      proto.WeaponImbue_WindfuryWeapon,
		SpellPowerBuff:    proto.SpellPowerBuff_GreaterArcaneElixir,
		StrengthBuff:      proto.StrengthBuff_JujuPower,
	}
	feralCons := &proto.Consumes{
		AgilityElixir:     proto.AgilityElixir_ElixirOfTheMongoose,
		AttackPowerBuff:   proto.AttackPowerBuff_JujuMight,
		DefaultConjured:   proto.Conjured_ConjuredDemonicRune,
		DefaultPotion:     proto.Potions_MajorManaPotion,
		DragonBreathChili: true,
		Flask:             proto.Flask_FlaskOfDistilledWisdom,
		Food:              proto.Food_FoodSmokedDesertDumpling,
		MainHandImbue:     proto.WeaponImbue_ElementalSharpeningStone,
		StrengthBuff:      proto.StrengthBuff_JujuPower,
	}
	bearCons := &proto.Consumes{
		AgilityElixir:     proto.AgilityElixir_ElixirOfTheMongoose,
		ArmorElixir:       proto.ArmorElixir_ElixirOfSuperiorDefense,
		AttackPowerBuff:   proto.AttackPowerBuff_JujuMight,
		DefaultPotion:     proto.Potions_GreaterStoneshieldPotion,
		DragonBreathChili: true,
		Flask:             proto.Flask_FlaskOfTheTitans,
		Food:              proto.Food_FoodSmokedDesertDumpling,
		HealthElixir:      proto.HealthElixir_ElixirOfFortitude,
		StrengthBuff:      proto.StrengthBuff_JujuPower,
	}
	retCons := &proto.Consumes{
		AgilityElixir:     proto.AgilityElixir_ElixirOfTheMongoose,
		AttackPowerBuff:   proto.AttackPowerBuff_JujuMight,
		DefaultPotion:     proto.Potions_MajorManaPotion,
		DragonBreathChili: true,
		Flask:             proto.Flask_FlaskOfSupremePower,
		FirePowerBuff:     proto.FirePowerBuff_ElixirOfFirepower,
		Food:              proto.Food_FoodSmokedDesertDumpling,
		SpellPowerBuff:    proto.SpellPowerBuff_GreaterArcaneElixir,
		StrengthBuff:      proto.StrengthBuff_JujuPower,
	}
	protPalaCons := &proto.Consumes{
		DefaultPotion:     proto.Potions_MajorManaPotion,
		AgilityElixir:     proto.AgilityElixir_ElixirOfTheMongoose,
		AttackPowerBuff:   proto.AttackPowerBuff_JujuMight,
		Flask:             proto.Flask_FlaskOfSupremePower,
		Food:              proto.Food_FoodSmokedDesertDumpling,
		StrengthBuff:      proto.StrengthBuff_JujuPower,
	}

	warriorOpts := &proto.Player_Warrior{Warrior: &proto.Warrior{Options: &proto.Warrior_Options{
		StartingRage: 50,
		Shout:        proto.WarriorShout_WarriorShoutBattle,
	}}}
	tankWarriorOpts := &proto.Player_TankWarrior{TankWarrior: &proto.TankWarrior{Options: &proto.TankWarrior_Options{
		Shout:        proto.WarriorShout_WarriorShoutCommanding,
		StartingRage: 0,
	}}}
	retOpts := &proto.Player_RetributionPaladin{RetributionPaladin: &proto.RetributionPaladin{Options: &proto.PaladinOptions{
		PrimarySeal: proto.PaladinSeal_Righteousness,
	}}}
	protPalaOpts := &proto.Player_ProtectionPaladin{ProtectionPaladin: &proto.ProtectionPaladin{Options: &proto.PaladinOptions{
		PrimarySeal:   proto.PaladinSeal_Righteousness,
		RighteousFury: true,
	}}}
	hunterOpts := &proto.Player_Hunter{Hunter: &proto.Hunter{Options: &proto.Hunter_Options{
		Ammo:           proto.Hunter_Options_RazorArrow,
		PetType:        proto.Hunter_Options_Cat,
		PetUptime:      1,
		PetAttackSpeed: 2.0,
	}}}
	rogueOpts := &proto.Player_Rogue{Rogue: &proto.Rogue{Options: &proto.RogueOptions{}}}
	shadowOpts := &proto.Player_ShadowPriest{ShadowPriest: &proto.ShadowPriest{Options: &proto.ShadowPriest_Options{
		Armor: proto.ShadowPriest_Options_InnerFire,
	}}}
	enhanceOpts := &proto.Player_EnhancementShaman{EnhancementShaman: &proto.EnhancementShaman{Options: &proto.EnhancementShaman_Options{
		SyncType: proto.ShamanSyncType_Auto,
	}}}
	eleOpts := &proto.Player_ElementalShaman{ElementalShaman: &proto.ElementalShaman{Options: &proto.ElementalShaman_Options{}}}
	mageOpts := &proto.Player_Mage{Mage: &proto.Mage{Options: &proto.Mage_Options{
		Armor: proto.Mage_Options_MoltenArmor,
	}}}
	lockAff := &proto.Player_Warlock{Warlock: &proto.Warlock{Options: &proto.WarlockOptions{
		Armor:       proto.WarlockOptions_DemonArmor,
		Summon:      proto.WarlockOptions_Succubus,
		WeaponImbue: proto.WarlockOptions_NoWeaponImbue,
	}}}
	lockDemo := &proto.Player_Warlock{Warlock: &proto.Warlock{Options: &proto.WarlockOptions{
		Armor:       proto.WarlockOptions_DemonArmor,
		Summon:      proto.WarlockOptions_Succubus,
		Sacrifice:   proto.WarlockOptions_Voidwalker,
		WeaponImbue: proto.WarlockOptions_NoWeaponImbue,
	}}}
	lockDestro := &proto.Player_Warlock{Warlock: &proto.Warlock{Options: &proto.WarlockOptions{
		Armor:       proto.WarlockOptions_DemonArmor,
		Summon:      proto.WarlockOptions_Imp,
		WeaponImbue: proto.WarlockOptions_NoWeaponImbue,
	}}}
	feralOpts := &proto.Player_FeralDruid{FeralDruid: &proto.FeralDruid{Options: &proto.FeralDruid_Options{
		InnervateTarget:   &proto.UnitReference{},
		LatencyMs:         100,
		AssumeBleedActive: true,
	}}}
	balanceOpts := &proto.Player_BalanceDruid{BalanceDruid: &proto.BalanceDruid{Options: &proto.BalanceDruid_Options{
		OkfUptime: 0.2,
	}}}
	bearOpts := &proto.Player_FeralTankDruid{FeralTankDruid: &proto.FeralTankDruid{Options: &proto.FeralTankDruid_Options{
		InnervateTarget: &proto.UnitReference{},
		StartingRage:    20,
	}}}

	warriorRaces := []string{"orc", "undead", "tauren", "troll", "windshaper", "human", "dwarf", "nightelf", "gnome", "highorder"}
	hunterRaces := []string{"orc", "tauren", "troll", "windshaper", "human", "dwarf", "nightelf", "highorder"}
	rogueRaces := []string{"orc", "undead", "troll", "windshaper", "human", "dwarf", "nightelf", "gnome", "highorder"}
	priestRaces := []string{"undead", "troll", "human", "dwarf", "nightelf", "gnome"}
	shamanRaces := []string{"orc", "tauren", "troll", "windshaper", "dwarf"}
	mageRaces := []string{"orc", "undead", "troll", "human", "gnome", "highorder"}
	lockRaces := []string{"orc", "undead", "troll", "human", "gnome"}
	druidRaces := []string{"tauren", "windshaper", "nightelf", "highorder"}
	palaRaces := []string{"undead", "human", "dwarf"}

	return []specJob{
		{
			id: "warrior-fury", class: proto.Class_ClassWarrior, races: warriorRaces,
			talents: "30305013002-050530035150010051", fallback: "30305013-050520035150310051", talentSource: "talentsforever",
			gearDir: "ui/warrior/gear_sets", gearFile: "p0.bis", aplDir: "ui/warrior/apls", aplFile: "dps_reck",
			specOptions: warriorOpts, consumes: warriorMelee,
		},
		{
			id: "warrior-arms", class: proto.Class_ClassWarrior, races: warriorRaces,
			talents: "30305213132515201-05050103", fallback: "30305013-050520035150310051", talentSource: "talentsforever",
			gearDir: "ui/warrior/gear_sets", gearFile: "arms_launch", aplDir: "ui/warrior/apls", aplFile: "dps_reck",
			specOptions: warriorOpts, consumes: warriorMelee,
		},
		{
			id: "warrior-prot", class: proto.Class_ClassWarrior, races: warriorRaces,
			talents: "35300003-05-532001233001210531", fallback: "31--552531233330012531", talentSource: "talentsforever",
			gearDir: "ui/tank_warrior/gear_sets", gearFile: "launch", aplDir: "ui/tank_warrior/apls", aplFile: "protection",
			specOptions: tankWarriorOpts, consumes: warriorMelee, isTank: true,
		},
		{
			id: "paladin-ret", class: proto.Class_ClassPaladin, races: palaRaces,
			talents: "255003--052253310012330321", fallback: "0550030022001--052251310002330321", talentSource: "talentsforever",
			gearDir: "ui/retribution_paladin/gear_sets", gearFile: "launch", aplDir: "ui/retribution_paladin/apls", aplFile: "basic_ret",
			specOptions: retOpts, consumes: retCons,
		},
		{
			id: "paladin-prot", class: proto.Class_ClassPaladin, races: palaRaces,
			talents: "2-4530513321301551-502", fallback: "052003003-5530513321301501", talentSource: "talentsforever",
			gearDir: "ui/protection_paladin/gear_sets", gearFile: "launch", aplDir: "ui/protection_paladin/apls", aplFile: "basic_prot",
			specOptions: protPalaOpts, consumes: protPalaCons, isTank: true,
		},
		{
			id: "hunter-survival", class: proto.Class_ClassHunter, races: hunterRaces,
			talents: "5-005005001-500230230250222151", fallback: "5023000501-0050550501503051", talentSource: "talentsforever",
			gearDir: "ui/hunter/gear_sets", gearFile: "p0.bis", aplDir: "ui/hunter/apls", aplFile: "p1",
			specOptions: hunterOpts, consumes: hunterCons, distance: 30,
		},
		{
			id: "hunter-mm", class: proto.Class_ClassHunter, races: hunterRaces,
			talents: "5-3053552011523051-5", fallback: "5023000501-0050550501503051", talentSource: "talentsforever",
			gearDir: "ui/hunter/gear_sets", gearFile: "p0.bis", aplDir: "ui/hunter/apls", aplFile: "p1",
			specOptions: hunterOpts, consumes: hunterCons, distance: 30,
		},
		{
			id: "hunter-bm", class: proto.Class_ClassHunter, races: hunterRaces,
			talents: "5120021505101251-00503520005", fallback: "5023000501-0050550501503051", talentSource: "talentsforever",
			gearDir: "ui/hunter/gear_sets", gearFile: "p0.bis", aplDir: "ui/hunter/apls", aplFile: "p1",
			specOptions: hunterOpts, consumes: hunterCons, distance: 30,
		},
		{
			id: "rogue-combat", class: proto.Class_ClassRogue, races: rogueRaces,
			talents: "005303105011-32030320200515231", fallback: "00530310501-32003311201515231", talentSource: "talentsforever",
			gearDir: "ui/rogue/gear_sets", gearFile: "combat_sinister_strike_prebis", aplDir: "ui/rogue/apls", aplFile: "combat_sinister_strike",
			specOptions: rogueOpts, consumes: rogueCombat,
		},
		{
			id: "rogue-assassination", class: proto.Class_ClassRogue, races: rogueRaces,
			talents: "00531310551521051-302303-002", fallback: "00530310551021051-302303202004", talentSource: "talentsforever",
			gearDir: "ui/rogue/gear_sets", gearFile: "combat_backstab_prebis", aplDir: "ui/rogue/apls", aplFile: "forever_mutilate",
			specOptions: rogueOpts, consumes: rogueMut, lockWeapons: true,
		},
		{
			id: "priest-shadow", class: proto.Class_ClassPriest, races: priestRaces,
			talents: "0250030013-3-500322501201302251", fallback: "0253000311--550022501201302251", talentSource: "talentsforever",
			gearDir: "ui/shadow_priest/gear_sets", gearFile: "p0.bis", aplDir: "ui/shadow_priest/apls", aplFile: "p1",
			specOptions: shadowOpts, consumes: casterMana,
		},
		{
			id: "shaman-enhance", class: proto.Class_ClassShaman, races: shamanRaces,
			talents: "05003305001-055030031005112251", fallback: "05023015-055030030205112251", talentSource: "talentsforever",
			gearDir: "ui/enhancement_shaman/gear_sets", gearFile: "launch", aplDir: "ui/enhancement_shaman/apls", aplFile: "default",
			specOptions: enhanceOpts, consumes: enhanceCons,
		},
		{
			id: "shaman-ele", class: proto.Class_ClassShaman, races: shamanRaces,
			talents: "5505301503123131-055002001", fallback: "2505301500123031-0500001-053050001", talentSource: "talentsforever",
			gearDir: "ui/elemental_shaman/gear_sets", gearFile: "launch", aplDir: "ui/elemental_shaman/apls", aplFile: "default",
			specOptions: eleOpts, consumes: casterMana,
		},
		{
			id: "mage-fire", class: proto.Class_ClassMage, races: mageRaces,
			talents: "050005-03552030130133151-005", fallback: "-03552020130133151-005500033", talentSource: "talentsforever",
			gearDir: "ui/mage/gear_sets", gearFile: "p0.bis", aplDir: "ui/mage/apls", aplFile: "forever_fire",
			specOptions: mageOpts, consumes: casterMana,
		},
		{
			id: "mage-frostfire", class: proto.Class_ClassMage, races: mageRaces,
			talents: "-0055103013013304-00550003310003002", fallback: "050005013--0555003301001301251", talentSource: "talentsforever",
			gearDir: "ui/mage/gear_sets", gearFile: "p0.bis", aplDir: "ui/mage/apls", aplFile: "forever_fire",
			specOptions: mageOpts, consumes: casterMana,
		},
		{
			id: "mage-arcane", class: proto.Class_ClassMage, races: mageRaces,
			talents: "255225223122311531-13", fallback: "055005023100311531--005500033", talentSource: "talentsforever",
			gearDir: "ui/mage/gear_sets", gearFile: "p0.bis", aplDir: "ui/mage/apls", aplFile: "forever_arcane",
			specOptions: mageOpts, consumes: casterMana,
		},
		{
			id: "warlock-affliction", class: proto.Class_ClassWarlock, races: lockRaces,
			talents: "05550320035201351-0050203001", fallback: "2535002013521105--05500051", talentSource: "talentsforever",
			gearDir: "ui/warlock/gear_sets", gearFile: "prebis", aplDir: "ui/warlock/apls", aplFile: "forever_affliction",
			specOptions: lockAff, consumes: casterMana,
		},
		{
			id: "warlock-demo", class: proto.Class_ClassWarlock, races: lockRaces,
			talents: "005-0050233201211031351-20550001", fallback: "113-0005003221220311351-0550005", talentSource: "talentsforever",
			gearDir: "ui/warlock/gear_sets", gearFile: "prebis", aplDir: "ui/warlock/apls", aplFile: "forever_pact",
			specOptions: lockDemo, consumes: casterMana,
		},
		{
			id: "warlock-destro", class: proto.Class_ClassWarlock, races: lockRaces,
			talents: "05-0050203001-2050355103101351", fallback: "25501-0025003001-055035510010002", talentSource: "talentsforever",
			gearDir: "ui/warlock/gear_sets", gearFile: "prebis", aplDir: "ui/warlock/apls", aplFile: "forever_shadow_and_flame",
			specOptions: lockDestro, consumes: casterMana,
		},
		{
			id: "druid-feral", class: proto.Class_ClassDruid, races: druidRaces,
			talents: "050022-5520002123032213051-05", fallback: "-5521002023132213051-05503", talentSource: "talentsforever",
			gearDir: "ui/feral_druid/gear_sets", gearFile: "launch", aplDir: "ui/feral_druid/apls", aplFile: "feral",
			specOptions: feralOpts, consumes: feralCons, lockWeapons: true,
		},
		{
			id: "druid-balance", class: proto.Class_ClassDruid, races: druidRaces,
			talents: "5532220115501351-05-5", fallback: "5502220115501351--055003", talentSource: "talentsforever",
			gearDir: "ui/balance_druid/gear_sets", gearFile: "launch", aplDir: "ui/balance_druid/apls", aplFile: "launch",
			specOptions: balanceOpts, consumes: casterMana,
		},
		{
			id: "druid-bear", class: proto.Class_ClassDruid, races: druidRaces,
			talents: "050022-5523022120132210551", fallback: "-5003232120132010501-0550325", talentSource: "talentsforever",
			gearDir: "ui/feral_tank_druid/gear_sets", gearFile: "launch", aplDir: "ui/feral_tank_druid/apls", aplFile: "bear",
			specOptions: bearOpts, consumes: bearCons, isTank: true, lockWeapons: true,
		},
	}
}

func meleeConsumes(potion proto.Potions, mh proto.WeaponImbue, oh proto.WeaponImbue) *proto.Consumes {
	return &proto.Consumes{
		AgilityElixir:     proto.AgilityElixir_ElixirOfTheMongoose,
		AttackPowerBuff:   proto.AttackPowerBuff_JujuMight,
		DefaultPotion:     potion,
		DragonBreathChili: true,
		Food:              proto.Food_FoodSmokedDesertDumpling,
		MainHandImbue:     mh,
		OffHandImbue:      oh,
		StrengthBuff:      proto.StrengthBuff_JujuPower,
	}
}

func casterConsumes() *proto.Consumes {
	return &proto.Consumes{
		DefaultPotion:  proto.Potions_MajorManaPotion,
		Flask:          proto.Flask_FlaskOfSupremePower,
		FirePowerBuff:  proto.FirePowerBuff_ElixirOfGreaterFirepower,
		Food:           proto.Food_FoodRunnTumTuberSurprise,
		MainHandImbue:  proto.WeaponImbue_BrilliantWizardOil,
		SpellPowerBuff: proto.SpellPowerBuff_GreaterArcaneElixir,
	}
}

func hunterConsumes() *proto.Consumes {
	return &proto.Consumes{
		AgilityElixir:     proto.AgilityElixir_ElixirOfTheMongoose,
		AttackPowerBuff:   proto.AttackPowerBuff_JujuMight,
		DefaultPotion:     proto.Potions_ManaPotion,
		DragonBreathChili: true,
		Flask:             proto.Flask_FlaskOfSupremePower,
		Food:              proto.Food_FoodSagefishDelight,
		MainHandImbue:     proto.WeaponImbue_Windfury,
		OffHandImbue:      proto.WeaponImbue_ElementalSharpeningStone,
		SpellPowerBuff:    proto.SpellPowerBuff_GreaterArcaneElixir,
		StrengthBuff:      proto.StrengthBuff_JujuPower,
	}
}
