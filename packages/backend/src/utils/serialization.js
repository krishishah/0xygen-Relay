"use strict";
exports.__esModule = true;
var bignumber_js_1 = require("bignumber.js");
var SerializerUtils = /** @class */ (function () {
    function SerializerUtils() {
    }
    SerializerUtils.SignedOrdertoJSON = function (signedOrder) {
        return {
            ecSignature: signedOrder.ecSignature,
            maker: signedOrder.maker,
            taker: signedOrder.taker,
            makerFee: signedOrder.makerFee.toString(),
            takerFee: signedOrder.takerFee.toString(),
            makerTokenAmount: signedOrder.makerTokenAmount.toString(),
            takerTokenAmount: signedOrder.takerTokenAmount.toString(),
            makerTokenAddress: signedOrder.makerTokenAddress,
            takerTokenAddress: signedOrder.takerTokenAddress,
            salt: signedOrder.salt.toString(),
            exchangeContractAddress: signedOrder.exchangeContractAddress,
            feeRecipient: signedOrder.feeRecipient,
            expirationUnixTimestampSec: signedOrder.expirationUnixTimestampSec.toString()
        };
    };
    SerializerUtils.SignedOrderfromJSON = function (signedOrderObj) {
        try {
            var signedOrder = {
                ecSignature: signedOrderObj.ecSignature,
                maker: signedOrderObj.maker,
                taker: signedOrderObj.taker,
                makerFee: new bignumber_js_1.BigNumber(signedOrderObj.makerFee),
                takerFee: new bignumber_js_1.BigNumber(signedOrderObj.takerFee),
                makerTokenAmount: new bignumber_js_1.BigNumber(signedOrderObj.makerTokenAmount),
                takerTokenAmount: new bignumber_js_1.BigNumber(signedOrderObj.takerTokenAmount),
                makerTokenAddress: signedOrderObj.makerTokenAddress,
                takerTokenAddress: signedOrderObj.takerTokenAddress,
                salt: new bignumber_js_1.BigNumber(signedOrderObj.salt),
                exchangeContractAddress: signedOrderObj.exchangeContractAddress,
                feeRecipient: signedOrderObj.feeRecipient,
                expirationUnixTimestampSec: new bignumber_js_1.BigNumber(signedOrderObj.expirationUnixTimestampSec)
            };
            return signedOrder;
        }
        catch (e) {
            console.log(e);
        }
    };
    SerializerUtils.TokenPairOrderbooktoJSON = function (tokenPairOrderbook) {
        var tokenPairOrderbookSchema = {
            bids: tokenPairOrderbook.bids.map(function (bid) { return SerializerUtils.SignedOrdertoJSON(bid); }),
            asks: tokenPairOrderbook.asks.map(function (ask) { return SerializerUtils.SignedOrdertoJSON(ask); })
        };
        return tokenPairOrderbookSchema;
    };
    return SerializerUtils;
}());
exports.SerializerUtils = SerializerUtils;
