"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGlobalstate = exports.DerivedGlobalState = exports.GlobalState = void 0;
var immer_1 = __importStar(require("immer"));
var GlobalState = /** @class */ (function () {
    function GlobalState(initialValue) {
        this.value = initialValue;
        this.subscribers = [];
    }
    GlobalState.prototype.getValue = function (selector) {
        if (selector) {
            return selector(this.value);
        }
        return this.value;
    };
    GlobalState.prototype.refresh = function () {
        this.subscribers.forEach(function (subscriber) {
            if (subscriber.refresh) {
                subscriber.refresh();
            }
        });
    };
    GlobalState.prototype.setValue = function (newValue, config) {
        if (config === void 0) { config = {}; }
        if (newValue === undefined) {
            this.__updateValue(function (draftVal) { return immer_1.nothing; }, config);
        }
        else if (Object.prototype.toString.call(newValue) === '[object Function]') {
            var reducer = newValue;
            this.setValue(reducer(this.getValue(config.selector)), config);
        }
        else {
            this.__updateValue(function (draftVal) { return newValue; }, config);
        }
    };
    GlobalState.prototype.updateValue = function (updater, config) {
        if (config === void 0) { config = {}; }
        var updaterWrapper = function (draftState) {
            // This wrapper is for disabling setting returned value
            // We don't allow returned value to be set(just return undefined)
            updater(draftState);
        };
        this.__updateValue(updaterWrapper, config);
    };
    GlobalState.prototype.__updateValue = function (updater, config) {
        if (config === void 0) { config = {}; }
        var selector = config.selector;
        var patcher = config.patcher;
        var oldState = this.value;
        var newState;
        if (selector && patcher) {
            console.log('haiiiiiiiiiiiiiii', immer_1);
            var nodeValue_1 = (0, immer_1.default)(selector(oldState), updater);
            newState = (0, immer_1.default)(oldState, function (draftCurrentState) {
                // Avoid setting returns
                patcher(draftCurrentState, nodeValue_1);
            });
        }
        else {
            console.log('haiiiiiiiiiiiiiii', immer_1);
            newState = (0, immer_1.default)(oldState, updater);
        }
        this.value = newState;
        if (newState !== oldState) {
            // There's a new update
            this.subscribers.forEach(function (subscriber) {
                if (subscriber.selector(newState) !== subscriber.selector(oldState)) {
                    // Node value has changed
                    subscriber.observer(subscriber.selector(newState));
                }
            });
        }
    };
    GlobalState.prototype.subscribe = function (itemToSubscribe) {
        var _this = this;
        var _itemToSubscribe;
        if (Object.prototype.toString.call(itemToSubscribe) === '[object Function]') {
            _itemToSubscribe = {
                observer: itemToSubscribe,
                selector: function (state) { return state; }
            };
        }
        else {
            _itemToSubscribe = itemToSubscribe;
        }
        if (this.subscribers.indexOf(_itemToSubscribe) === -1) {
            // Subscribe a component to this global state
            this.subscribers.push(_itemToSubscribe);
        }
        ;
        var unsubscribe = function () {
            _this.subscribers = _this.subscribers.filter(function (subscriber) { return (subscriber !== _itemToSubscribe); });
        };
        return unsubscribe;
    };
    GlobalState.prototype.select = function (selector) {
        return createDerivedGlobalstate(this, selector);
    };
    return GlobalState;
}());
exports.GlobalState = GlobalState;
var DerivedGlobalState = /** @class */ (function () {
    function DerivedGlobalState(globalState, selector) {
        this.globalState = globalState;
        this.selector = selector;
    }
    DerivedGlobalState.prototype.getValue = function () {
        return this.globalState.getValue(this.selector);
    };
    DerivedGlobalState.prototype.subscribe = function (observer, refresh) {
        var itemToSubscribe = {
            observer: observer,
            selector: this.selector,
            refresh: refresh
        };
        return this.globalState.subscribe(itemToSubscribe);
    };
    return DerivedGlobalState;
}());
exports.DerivedGlobalState = DerivedGlobalState;
function createDerivedGlobalstate(globalState, selector) {
    return new DerivedGlobalState(globalState, selector);
}
function createGlobalstate(initialValue) {
    return new GlobalState(initialValue);
}
exports.createGlobalstate = createGlobalstate;
