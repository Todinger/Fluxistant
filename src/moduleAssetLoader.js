const _ = require('lodash');
const Utils = require('./utils');

class PromiseHolder {
    constructor(promise) {
        this.promise = promise;
    }
}

class ModuleAssetLoader {
    constructor(assets) {
        this._assets = assets;
        this._promises = [];
    }

    // Loads every file asset in `target` and returns a promise that creates mirror image of it with
    // all the assets loaded.
    // If given an array of image files, the result will be an array of the image contents suitable for web
    // display.
    // If given an object with properties, any property (at any depth) that is a file will be loaded
    // and replaced in the promise result with the contents.
    // A value is considered a "file" if it either has a `fileKey` attribute or a `file.fileKey` attribute.
    async loadWeb(target) {
        this._promises = [];
        let result = this._loadTarget(target);
        await Promise.all(this._promises);
        return await this._resolveAll(result);
    }

    async _resolveAll(target) {
        if (target instanceof PromiseHolder) {
            let extracted = await target.promise;
            return extracted.data;
        }

        if (_.isPlainObject(target)) {
            let result = {};
            for (const key in target) {
                result[key] = await this._resolveAll(target[key]);
            }

            return result;
        } else if (_.isArray(target)) {
            let results = [];
            for (let i = 0; i < target.length; i++) {
                results.push(await this._resolveAll(target[i]));
            }

            return results;
        }

        return target;
    }

    _loadTarget(target) {
        let isFile, fileKey, width, height;
        ({isFile, fileKey, width, height} = this._checkFile(target));
        if (isFile) {
            if (fileKey) {
                return {
                    url: this._append(this._assets.getFileWebByKey(fileKey)),
                    width,
                    height,
                };
            }

            return null;
        }

        if (_.isPlainObject(target)) {
            return Utils.objectMap(target, (key, value) => this._loadTarget(value));
        } else if (_.isArray(target)) {
            return target.map(target => this._loadTarget(target));
        }

        return target;
    }

    _append(promise) {
        this._promises.push(promise);
        return new PromiseHolder(promise);
    }

    _checkFile(target) {
        if (!_.isPlainObject(target)) return {isFile: false};
        if (target.fileKey) return {
            isFile: true,
            fileKey: target.fileKey,
        };
        if (_.isPlainObject(target.file) && target.file.fileKey) return {
            isFile: true,
            fileKey: target.file.fileKey,
            width: target.width,
            height: target.height,
        };
        return {isFile: false};
    }
}


module.exports = ModuleAssetLoader;
