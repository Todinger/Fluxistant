const Errors = requireMain('errors');
const Utils = requireMain('utils');


class Prize {
    constructor(mod) {
        this.mod = mod;
    }

    grant(username, displayName, details) {
        Errors.abstract();
        return "";
    }
}

class PokyecatsYarnPrize extends Prize {
    grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addYarn(username, displayName, amount);
        return `${amount} ${Utils.plurality(amount, "piece")} of yarn.`
    }
}

class PokyecatsYarnBallPrize extends Prize {
    grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addYarnBall(username, displayName, amount);
        return `${amount} ${Utils.plurality(amount, "yarn ball")}.`
    }
}

class PokyecatsGoldBallPrize extends Prize {
    grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addGoldBall(username, displayName, amount);
        return `${amount} ${Utils.plurality(amount, "gold ball")}.`
    }
}

class PokyecatsCatchesPrize extends Prize {
    grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addCatches(username, displayName, amount);
        return `${amount} ${Utils.plurality(amount, "Pokyecats", "Pokyecatses")}!`
    }
}

class PokyecatsShinyCatchesPrize extends Prize {
    grant(username, displayName, details) {
        let amount = Utils.randomInt(details.min, details.max + 1);
        this.mod.pokyecats.addShinyCatches(username, displayName, amount);
        return `${amount} SHINY ${Utils.plurality(amount, "POKYECATS", "POKYECATSES")}!!!`
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
