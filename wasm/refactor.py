import re

with open("original_main.go", "r") as f:
    code = f.read()

# 1. Imports
imports = """import (
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
"""
code = re.sub(r'import \([\s\S]*?\)', imports, code, count=1)

# 2. Extract loadJobGear and replace it
# The original loadJobGear is from `func loadJobGear(` to its closing `}`
code = re.sub(r'func loadJobGear\([\s\S]*?\n\}\n', '', code, count=1)

# 3. Replace main() and add JS exports
js_funcs = """
func getAplRotation(dir string, file string) core.RotationCombo {
	filePath := "data/" + dir + "/" + file + ".apl.json"
	data, err := embeddedData.ReadFile(filePath)
	if err != nil {
		fmt.Printf("failed to load apl json file: %s, %s\\n", filePath, err)
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
	// Fallback to UI gear
	filePath := "data/" + job.gearDir + "/" + job.gearFile + ".gear.json"
	data, err := embeddedData.ReadFile(filePath)
	if err != nil {
		fmt.Printf("failed to load gear json file: %s, %s\\n", filePath, err)
	}
	return core.GearSetCombo{Label: job.gearFile, GearSet: core.EquipmentSpecFromJsonString(string(data))}
}

func resimSpec(this js.Value, args []js.Value) interface{} {
	specId := args[0].String()
	talents := args[1].String()
	iters := args[2].Int()
	seed := args[3].Int()
	mobTypeStr := args[4].String()
	
	if seed == 0 {
		seed = int(time.Now().UnixNano() & 0x7fffffff)
		if seed == 0 { seed = 1 }
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
		return js.ValueOf("[]")
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
		return js.ValueOf("[]")
	}
	return js.ValueOf(string(outBytes))
}

func main() {
	c := make(chan struct{}, 0)
	js.Global().Set("resimSpecWasm", js.FuncOf(resimSpec))
	sim.RegisterAll()
	<-c
}
"""
code = re.sub(r'func main\(\) \{[\s\S]*?\n\}\n', js_funcs, code, count=1)

with open("main.go", "w") as f:
    f.write(code)
