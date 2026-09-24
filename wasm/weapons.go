package main

import (
	"fmt"
	"math"
	"strings"

	"github.com/wowsims/classic/sim/core"
	"github.com/wowsims/classic/sim/core/proto"
	"github.com/wowsims/classic/sim/core/stats"
)

type gearPiece struct {
	Slot string `json:"slot"`
	Name string `json:"name"`
	ID   int32  `json:"id,omitempty"`
}

var slotLabels = []string{
	"Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet",
	"Finger", "Finger", "Trinket", "Trinket", "Main Hand", "Off Hand", "Ranged",
}

func equippedPieces(spec *proto.EquipmentSpec) []gearPiece {
	if spec == nil {
		return nil
	}
	eq := core.ProtoToEquipment(spec)
	mhTwoHand := eq[proto.ItemSlot_ItemSlotMainHand].HandType == proto.HandType_HandTypeTwoHand
	out := make([]gearPiece, 0, len(slotLabels))
	for i, label := range slotLabels {
		item := eq[i]
		if item.ID == 0 {
			if proto.ItemSlot(i) == proto.ItemSlot_ItemSlotOffHand && mhTwoHand {
				continue
			}
			out = append(out, gearPiece{Slot: label, Name: "(empty)"})
			continue
		}
		name := item.Name
		if name == "" {
			name = fmt.Sprintf("item %d", item.ID)
		}
		out = append(out, gearPiece{Slot: label, Name: name, ID: item.ID})
	}
	return out
}

func racializeGear(base *proto.EquipmentSpec, race proto.Race, class proto.Class, lockWeapons bool) *proto.EquipmentSpec {
	want, ok := racialWeaponType(race)
	if !ok || lockWeapons || base == nil {
		return base
	}

	eq := core.ProtoToEquipment(base)
	if hasWeaponType(eq, want) {
		return eq.ToEquipmentSpecProto()
	}
	replaceSlot(eq.MainHand(), want, class)
	if !hasWeaponType(eq, want) {
		replaceSlot(eq.OffHand(), want, class)
	}
	return eq.ToEquipmentSpecProto()
}

func hasWeaponType(eq core.Equipment, want proto.WeaponType) bool {
	return eq.MainHand().WeaponType == want || eq.OffHand().WeaponType == want
}

func racialWeaponType(race proto.Race) (proto.WeaponType, bool) {
	switch race {
	case proto.Race_RaceOrc:
		return proto.WeaponType_WeaponTypeAxe, true
	case proto.Race_RaceHuman:
		return proto.WeaponType_WeaponTypeSword, true
	case proto.Race_RaceDwarf:
		return proto.WeaponType_WeaponTypeMace, true
	default:
		return proto.WeaponType_WeaponTypeUnknown, false
	}
}

func weaponFamilyOf(eq *proto.EquipmentSpec) string {
	if eq == nil {
		return ""
	}
	equipped := core.ProtoToEquipment(eq)
	return weaponFamilyName(equipped.MainHand().WeaponType)
}

func weaponFamilyName(wt proto.WeaponType) string {
	switch wt {
	case proto.WeaponType_WeaponTypeAxe:
		return "axe"
	case proto.WeaponType_WeaponTypeSword:
		return "sword"
	case proto.WeaponType_WeaponTypeMace:
		return "mace"
	case proto.WeaponType_WeaponTypeDagger:
		return "dagger"
	case proto.WeaponType_WeaponTypeStaff:
		return "staff"
	default:
		return "none"
	}
}

func replaceSlot(slot *core.Item, want proto.WeaponType, class proto.Class) {
	if slot == nil || slot.ID == 0 || !slot.IsWeapon() {
		return
	}
	if slot.WeaponType == want {
		return
	}
	hand := slot.HandType
	if !classWields(class, want, hand) {
		if slot.WeaponType != proto.WeaponType_WeaponTypeStaff || !classWields(class, want, proto.HandType_HandTypeOneHand) {
			return
		}
		hand = proto.HandType_HandTypeOneHand
	}
	next := findReplacement(*slot, want, class, hand)
	if next == 0 {
		return
	}
	*slot = core.NewItem(core.ItemSpec{
		ID:      next,
		Enchant: slot.Enchant.EffectID,
	})
}

func findReplacement(current core.Item, want proto.WeaponType, class proto.Class, hand proto.HandType) int32 {
	currentDps := weaponDps(current)
	currentCaster := casterWeight(current)
	group := handGroup(hand)
	bestID := int32(0)
	bestScore := math.MaxFloat64

	for id, cand := range core.ItemsByID {
		if cand.WeaponType != want {
			continue
		}
		if handGroup(cand.HandType) != group {
			continue
		}
		if !classWields(class, cand.WeaponType, cand.HandType) {
			continue
		}
		if !canClassUse(cand, class) {
			continue
		}
		if cand.Name == "" || isPvpRanked(cand.Name) {
			continue
		}
		candDps := weaponDps(cand)
		if currentDps > 0 && (candDps > currentDps*1.12 || candDps < currentDps*0.95) {
			continue
		}
		currentIsCaster := isCasterWeapon(current)
		if currentIsCaster != isCasterWeapon(cand) {
			continue
		}
		var score float64
		if currentIsCaster {
			score = math.Abs(casterWeight(cand) - currentCaster)
		} else {
			score = math.Abs(candDps - currentDps)
			score += math.Abs(meleeWeight(cand) - meleeWeight(current)) * 0.15
			if current.SwingSpeed > 0 && cand.SwingSpeed > 0 {
				score += math.Abs(cand.SwingSpeed-current.SwingSpeed) * 8
			}
			if meleeWeight(current) == 0 && casterWeight(current) == 0 &&
				meleeWeight(cand) == 0 && casterWeight(cand) == 0 {
				score += 20
			}
		}
		if score < bestScore || (score == bestScore && id < bestID) {
			bestScore = score
			bestID = id
		}
	}
	return bestID
}

func weaponDps(item core.Item) float64 {
	if item.SwingSpeed <= 0 {
		return 0
	}
	return (item.WeaponDamageMin + item.WeaponDamageMax) / 2 / item.SwingSpeed
}

func meleeWeight(item core.Item) float64 {
	return item.Stats[stats.Strength] +
		item.Stats[stats.Agility] +
		item.Stats[stats.AttackPower]*0.5
}

func isCasterWeapon(item core.Item) bool {
	power := casterWeight(item)
	return power >= 15 && power > meleeWeight(item)
}

func casterWeight(item core.Item) float64 {
	return item.Stats[stats.Intellect] +
		item.Stats[stats.SpellPower] +
		item.Stats[stats.HealingPower] +
		item.Stats[stats.ArcanePower] +
		item.Stats[stats.FirePower] +
		item.Stats[stats.FrostPower] +
		item.Stats[stats.HolyPower] +
		item.Stats[stats.NaturePower] +
		item.Stats[stats.ShadowPower]
}

func handGroup(hand proto.HandType) string {
	if hand == proto.HandType_HandTypeTwoHand {
		return "2h"
	}
	if hand == proto.HandType_HandTypeOffHand {
		return "oh"
	}
	return "1h"
}

func canClassUse(item core.Item, class proto.Class) bool {
	if len(item.ClassAllowlist) == 0 {
		return true
	}
	for _, allowed := range item.ClassAllowlist {
		if allowed == class {
			return true
		}
	}
	return false
}

func isPvpRanked(name string) bool {
	return strings.Contains(name, "Grand Marshal") ||
		strings.Contains(name, "High Warlord") ||
		strings.Contains(name, "Marshal's") ||
		strings.Contains(name, "Warlord's")
}

func classWields(class proto.Class, wt proto.WeaponType, hand proto.HandType) bool {
	twoHand := hand == proto.HandType_HandTypeTwoHand
	switch class {
	case proto.Class_ClassWarrior:
		return wt != proto.WeaponType_WeaponTypeShield && wt != proto.WeaponType_WeaponTypeOffHand
	case proto.Class_ClassPaladin:
		return wt == proto.WeaponType_WeaponTypeSword || wt == proto.WeaponType_WeaponTypeMace || wt == proto.WeaponType_WeaponTypePolearm
	case proto.Class_ClassHunter:
		return wt == proto.WeaponType_WeaponTypeAxe ||
			wt == proto.WeaponType_WeaponTypeSword ||
			wt == proto.WeaponType_WeaponTypeDagger ||
			wt == proto.WeaponType_WeaponTypePolearm ||
			wt == proto.WeaponType_WeaponTypeStaff ||
			wt == proto.WeaponType_WeaponTypeFist
	case proto.Class_ClassRogue:
		if twoHand {
			return false
		}
		return wt == proto.WeaponType_WeaponTypeDagger ||
			wt == proto.WeaponType_WeaponTypeSword ||
			wt == proto.WeaponType_WeaponTypeMace ||
			wt == proto.WeaponType_WeaponTypeFist ||
			wt == proto.WeaponType_WeaponTypeAxe
	case proto.Class_ClassPriest:
		if twoHand {
			return wt == proto.WeaponType_WeaponTypeStaff
		}
		return wt == proto.WeaponType_WeaponTypeMace || wt == proto.WeaponType_WeaponTypeDagger
	case proto.Class_ClassShaman:
		return wt == proto.WeaponType_WeaponTypeMace ||
			wt == proto.WeaponType_WeaponTypeStaff ||
			wt == proto.WeaponType_WeaponTypeAxe ||
			wt == proto.WeaponType_WeaponTypeDagger ||
			wt == proto.WeaponType_WeaponTypeFist ||
			wt == proto.WeaponType_WeaponTypePolearm
	case proto.Class_ClassMage, proto.Class_ClassWarlock:
		if twoHand {
			return wt == proto.WeaponType_WeaponTypeStaff
		}
		return wt == proto.WeaponType_WeaponTypeSword || wt == proto.WeaponType_WeaponTypeDagger
	case proto.Class_ClassDruid:
		return wt == proto.WeaponType_WeaponTypeMace ||
			wt == proto.WeaponType_WeaponTypeStaff ||
			wt == proto.WeaponType_WeaponTypeDagger ||
			wt == proto.WeaponType_WeaponTypeFist ||
			wt == proto.WeaponType_WeaponTypePolearm
	default:
		return false
	}
}
