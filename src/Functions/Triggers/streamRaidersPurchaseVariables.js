const Variable = require("../Variables/functionVariable");

const variables = {
    player: new Variable({
        name: 'Player (`$player`)',
        description: 'The player who made the purchase',
        example: '"$player just bought a skin!" will show e.g. "Fluxbot just bought a skin!"',
        condition: 'Can only be used when activated by any type of skin purchase in the SR store.',

        expr: '$player',
        replacement: data => data.context.params.trigger.player,
    }),
    sp: new Variable({
        name: 'SP (`$sp`)',
        description: 'The amount of SP obtained from the purchase',
        example: '"We just got $sp SP closer to a full skin!" will show e.g. "We just got 2 SP closer to a full skin!"',
        condition: 'Can only be used when activated by any type of skin purchase in the SR store.',

        expr: '$sp',
        replacement: data => data.context.params.trigger.sp,
    }),
    skin: new Variable({
        name: 'Skin (`$skin`)',
        description: 'The full name of the skin that was purchased',
        example: '"$player just got a shiny new $skin!" will show e.g. "Fluxbot just got a shiny new Epic Orc Slayer!"',
        condition: 'Can only be used when activated by a personal skin purchase or single gift bomb.',

        expr: '$skin',
        replacement: data => data.context.params.trigger.skin,
    }),
    unit: new Variable({
        name: 'Unit (`$unit`)',
        description: 'The name of the unit for which a skin was purchased',
        example: '"$player got a fancy new skin for their $unit!" will show e.g. "Fluxbot got a fancy new skin for their Flag Bearer!"',
        condition: 'Can only be used when activated by a personal skin purchase or single gift bomb.',

        expr: '$unit',
        replacement: data => data.context.params.trigger.unit,
    }),
    color: new Variable({
        name: 'Holo Color (`$color`)',
        description: 'The color of the Holo skin that was purchased',
        example: '"$player sure fancies $color things!" will show e.g. "Fluxbot sure fancies Blue things!"',
        condition: 'Can only be used when activated by a personal skin purchase or single gift bomb of a Holo skin.',

        expr: '$color',
        replacement: data => data.context.params.trigger.color,
    }),
    recipient: new Variable({
        name: 'Recipient (`$recipient`)',
        description: 'The name of the player who got the gifted skin',
        example: '"$player gave $recipient a new skin!" will show e.g. "Fluxbot gave Yecatsbot a new skin!"',
        condition: 'Can only be used when activated by a direct skin gift or single gift bomb.',

        expr: '$recipient',
        replacement: data => data.context.params.trigger.recipient,
    }),
    amount: new Variable({
        name: 'Amount (`$amount`)',
        description: 'The number of gifted skin in the skin bomb',
        example: '"$player threw $amount skins into the crowd!" will show e.g. "Fluxbot threw 10 skins into the crowd!"',
        condition: 'Can only be used when activated by a skin gift bomb.',

        expr: '$amount',
        replacement: data => data.context.params.trigger.amount,
    }),
}

module.exports = {
    ...variables,
    common: [
        variables.player,
        variables.sp,
    ],
};
