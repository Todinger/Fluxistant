const Errors = requireMain('errors');
const Utils = requireMain('utils');


const PRIZE_QUALITY_CLASSES = {
    NICE: "prize-nice",
    GOOD: "prize-good",
    GREAT: "prize-great",
    AMAZING: "prize-amazing",
    OMG: "prize-omg",
}


class Prize {
    constructor(mod) {
        this.mod = mod;
    }

    grant(username, displayName, details) {
        Errors.abstract();
        return {};
    }
}

class PokyecatsYarnPrize extends Prize {
    grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addYarn(username, displayName, amount);
        let text = `${amount} ${Utils.plurality(amount, "piece")} of yarn.`;
        let html = text;
        let quality = PRIZE_QUALITY_CLASSES.NICE;
        return {text, html, quality};
    }
}

class PokyecatsYarnBallPrize extends Prize {
    grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addYarnBall(username, displayName, amount);
        let text = `${amount} ${Utils.plurality(amount, "yarn ball")}.`;
        let html = text;
        let quality = PRIZE_QUALITY_CLASSES.GOOD;
        return {text, html, quality};
    }
}

class PokyecatsGoldBallPrize extends Prize {
    grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addGoldBall(username, displayName, amount);
        let text = `${amount} ${Utils.plurality(amount, "gold ball")}.`;
        let html = text;
        let quality = PRIZE_QUALITY_CLASSES.GREAT;
        return {text, html, quality};
    }
}

class PokyecatsCatchesPrize extends Prize {
    grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addCatches(username, displayName, amount);
        let text = `${amount} ${Utils.plurality(amount, "Pokyecats", "Pokyecatses")}!`;
        let html = text;
        let quality = PRIZE_QUALITY_CLASSES.AMAZING;
        return {text, html, quality};
    }
}

class PokyecatsShinyCatchesPrize extends Prize {
    grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addShinyCatches(username, displayName, amount);
        let text = `${amount} SHINY ${Utils.plurality(amount, "POKYECATS", "POKYECATSES")}!!!`;
        let html = text;
        let quality = PRIZE_QUALITY_CLASSES.OMG;
        return {text, html, quality};
    }
}


module.exports = {
    pokyecats: {
        yarn: (mod) => new PokyecatsYarnPrize(mod),
        yarnBall: (mod) => new PokyecatsYarnBallPrize(mod),
        goldBall: (mod) => new PokyecatsGoldBallPrize(mod),
        catches: (mod) => new PokyecatsCatchesPrize(mod),
        shinyCatches: (mod) => new PokyecatsShinyCatchesPrize(mod),
    },
}
