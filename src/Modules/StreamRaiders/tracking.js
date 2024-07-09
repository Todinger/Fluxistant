const _ = require('lodash');
const StreamRaidersManager = requireMain("./streamRaidersManager");
const Logger = requireMain('logger')
const Utils = requireMain('./utils');


class StreamRaidersPurchaseTracker {
    constructor(srModule) {
        this.mod = srModule;
        this.data = this.mod.data;

        this.eventHandlers = {
            skinathonStarted: (skinathonState) => this._skinathonStarted(skinathonState),
            skinPurchase: (purchaseDetails) => this._skinPurchase(purchaseDetails),
        };

        this.currentSkinathon = null;
    }

    dataLoaded() {
        this.data = this.mod.data;

        if (this.data.skinathons) {
            const existingSkinathons = Object.values(this.data.skinathons);
            if (existingSkinathons && existingSkinathons.length > 0) {
                this.currentSkinathon = existingSkinathons[existingSkinathons.length - 1];
            }
        }
    }

    _enableEventHandlers() {
        StreamRaidersManager.onSkinathonStarted(this.eventHandlers.skinathonStarted);
        StreamRaidersManager.onAnySkinPurchase(this.eventHandlers.skinPurchase);
    }

    _disableEventHandlers() {
        StreamRaidersManager.removeSkinathonStartedCallback(this.eventHandlers.skinathonStarted);
        StreamRaidersManager.removeAnySkinPurchaseCallback(this.eventHandlers.skinPurchase);
    }

    _skinathonStarted(skinathonState) {
        if (!(skinathonState.startDate in this.data.skinathons)) {
            this.data.skinathons[skinathonState.startDate] = {
                purchases: [],
                users: {},
            };
        }

        this.currentSkinathon = this.data.skinathons[skinathonState.startDate];
    }

    _skinPurchase(purchaseDetails) {
        this._ensurePlayer(purchaseDetails);
        const purchaseIndex = this.data.purchases.length;  // Note that this is before pushing to the array
        this.data.purchases.push({
            time: Utils.formatDate(new Date(), "YYYY.MM.DD-HH.mm.ss"),
            sp: purchaseDetails.sp,
            details: purchaseDetails.toString(),
        });
        this.data.users[purchaseDetails.playerUsername].purchases.push(purchaseIndex);
        if (this.currentSkinathon !== null) {
            this.currentSkinathon.purchases.push(purchaseIndex);
            let userData = this.currentSkinathon.users[purchaseDetails.playerUsername];
            userData.purchases.push(purchaseIndex);
            userData.totalSP += purchaseDetails.sp;
        }

        this.mod.saveData();
    }

    _ensurePlayer(purchaseDetails) {
        if (!(purchaseDetails.playerUsername in this.data.users)) {
            this.data.users[purchaseDetails.playerUsername] = {
                displayName: purchaseDetails.player,
                purchases: [],
            };
        }

        if (this.currentSkinathon !== null && !(purchaseDetails.playerUsername in this.currentSkinathon.users)) {
            this.currentSkinathon.users[purchaseDetails.playerUsername] = {
                purchases: [],
                totalSP: 0,
            };
        }
    }

    enable() {
        this._enableEventHandlers();
    }

    disable() {
        this._disableEventHandlers();
    }

    get latestSkinathon() {
        if (_.isEmpty(this.data.skinathons)) {
            return null;
        }

        const skinathons = Object.values(this.data.skinathons);
        return skinathons[skinathons.length - 1];
    }

    _getPurchasesFromIndices(indices) {
        let totalSP = 0;
        let purchases = [];
        indices.forEach(purchaseIndex => {
            if (purchaseIndex >= this.data.purchases.length) {
                throw `Data corrupted: User purchase has index ${purchaseIndex} but there are only ${this.data.purchases.length} purchases on record.`;
            }

            let purchase = this.data.purchases[purchaseIndex];
            purchases.push(purchase);
            totalSP += purchase.sp;
        });

        return {
            purchases,
            totalSP,
        };
    }

    _formatReport(userDisplayName, report) {
        let text = `${userDisplayName}: ${report.totalSP}\n`;
        for (let purchase of report.purchases) {
            text += `- [${purchase.time}] ${purchase.details}\n`;
        }

        text += "\n";
        return text;
    }

    getUserLifetimeReport(username) {
        if (!(username in this.data.users)) {
            return {
                purchases: [],
                totalSP: 0,
            };
        }

        let userPurchases = this.data.users[username].purchases;
        return this._getPurchasesFromIndices(userPurchases);
    }

    getUserSkinathonReport(username) {
        const skinathon = this.latestSkinathon;
        if (skinathon === null || !(username in skinathon.users)) {
            return {
                purchases: [],
                totalSP: 0,
            };
        }

        let userPurchases = skinathon.users[username].purchases;
        return this._getPurchasesFromIndices(userPurchases);
    }

    getLatestSkinathonReport() {
        const skinathon = this.latestSkinathon;
        if (skinathon === null) return null;
        let report = {};
        Object.keys(skinathon.users).forEach(username => {
            if (!(username in this.data.users)) {
                Logger.warn(`Data corruption: Missing player data for ${username}.`);
                return;
            }

            report[this.data.users[username].displayName] = this.getUserSkinathonReport(username);
        });

        return report;
    }

    getFormattedUserLifetimeReport(username) {
        if (!(username in this.data.users)) {
            return "No data available.";
        }

        let report = this.getUserLifetimeReport(username);
        return this._formatReport(this.data.users[username].displayName, report);
    }

    getFormattedUserSkinathonReport(username) {
        const skinathon = this.latestSkinathon;
        if (skinathon === null || !(username in skinathon.users)) {
            return "No data available.";
        }

        let report = this.getUserSkinathonReport(username);
        return this._formatReport(this.data.users[username].displayName, report);
    }

    getFormattedLatestSkinathonReport() {
        let report = this.getLatestSkinathonReport();
        if (report === null) return null;
        let texts = {};
        Utils.objectForEach(report, (userDisplayName, userReport) => {
            texts[userDisplayName] = this._formatReport(userDisplayName, userReport);
        });

        let text = "";
        let names = Object.keys(texts);
        names.sort(function (a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });
        names.forEach(name => {
            text += texts[name];
        });

        return text;
    }
}


module.exports = StreamRaidersPurchaseTracker;
