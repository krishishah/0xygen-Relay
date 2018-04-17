"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
var typeorm_1 = require("typeorm");
var SignedOrderEntity = /** @class */ (function () {
    function SignedOrderEntity() {
    }
    __decorate([
        typeorm_1.PrimaryColumn()
    ], SignedOrderEntity.prototype, "orderHashHex");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "ECSignatureV");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "ECSignatureR");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "ECSignatureS");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "maker");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "taker");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "makerFee");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "takerFee");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "makerTokenAmount");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "takerTokenAmount");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "makerTokenAddress");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "takerTokenAddress");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "salt");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "exchangeContractAddress");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "feeRecipient");
    __decorate([
        typeorm_1.Column()
    ], SignedOrderEntity.prototype, "expirationUnixTimestampSec");
    SignedOrderEntity = __decorate([
        typeorm_1.Entity()
    ], SignedOrderEntity);
    return SignedOrderEntity;
}());
exports.SignedOrderEntity = SignedOrderEntity;
