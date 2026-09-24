package main

import (
		"github.com/wowsims/classic/sim/core"
	"github.com/wowsims/classic/sim/core/proto"
)



const foreverSimOrigin = "https://elliotwood.github.io/Forever/classic/"



func factionOf(race proto.Race) proto.Faction {
	switch race {
	case proto.Race_RaceOrc, proto.Race_RaceUndead, proto.Race_RaceTauren, proto.Race_RaceTroll, proto.Race_RaceSkyborneWindshaper:
		return proto.Faction_Horde
	case proto.Race_RaceHuman, proto.Race_RaceDwarf, proto.Race_RaceNightElf, proto.Race_RaceGnome, proto.Race_RaceSkyborneHighOrder:
		return proto.Faction_Alliance
	default:
		return proto.Faction_Unknown
	}
}

func playerFor(
	job specJob,
	race proto.Race,
	talents string,
	gear *proto.EquipmentSpec,
	rotation *proto.APLRotation,
	buffs core.BuffsCombo,
) *proto.Player {
	distance := job.distance
	if distance == 0 {
		distance = 5
	}
	return core.WithSpec(&proto.Player{
		Class:              job.class,
		Race:               race,
		Equipment:          gear,
		Consumes:           job.consumes,
		Buffs:              buffs.Player,
		TalentsString:      talents,
		Profession1:        proto.Profession_Engineering,
		Rotation:           rotation,
		DistanceFromTarget: distance,
		ReactionTimeMs:     150,
		ChannelClipDelayMs: 50,
	}, job.specOptions)
}


























