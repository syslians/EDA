"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var cors = require("cors");
var typeorm_1 = require("typeorm");
var product_1 = require("./entity/product");
var amqp = require("amqplib/callback_api");
var AppDataSource = new typeorm_1.DataSource({
    type: "mysql",
    host: "127.0.0.1",
    port: 3306,
    username: "root",
    password: "root",
    database: "yt_node_admin",
    entities: [
        "src/entity/*.js"
    ],
    logging: false,
    synchronize: true
});
AppDataSource.initialize()
    .then(function (db) {
    var app = express();
    var productRepository = db.getRepository(product_1.Product);
    amqp.connect('amqps://hvqmbjdq:OaEWP5JYid10szxBBIVIXGwG5JHn8Y22@gerbil.rmq.cloudamqp.com/hvqmbjdq', function (error0, connection) {
        if (error0) {
            throw error0;
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error0;
            }
            app.use(cors({
                origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:4200']
            }));
            app.use(express.json());
            //데이터베이스 product 테이블 전체 조회
            app.get('/api/products', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var products;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, productRepository.find()];
                        case 1:
                            products = _a.sent();
                            channel.sendToQueue('hello', Buffer.from('hello'));
                            res.json(products);
                            return [2 /*return*/];
                    }
                });
            }); });
            //데이터베이스 새 데이터 생성 
            app.post('/api/products', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var product, result, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            return [4 /*yield*/, productRepository.create(req.body)];
                        case 1:
                            product = _a.sent();
                            if (!product) return [3 /*break*/, 3];
                            return [4 /*yield*/, productRepository.save(product)];
                        case 2:
                            result = _a.sent();
                            channel.sendToQueue('product_created', Buffer.from(JSON.stringify(result)));
                            return [2 /*return*/, res.send(result)];
                        case 3: return [2 /*return*/, res.status(404).json({ Error: '해당 제품을 찾지 못했습니다.' })];
                        case 4: return [3 /*break*/, 6];
                        case 5:
                            error_1 = _a.sent();
                            return [2 /*return*/, res.status(500).json({ error: '데이터베이스 조회 에러' })];
                        case 6: return [2 /*return*/];
                    }
                });
            }); });
            //데이터베이스에 있는 제품들중 단일 제품 검색
            app.get('/api/products/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var productId, product, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            productId = parseInt(req.params.id, 10);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, productRepository.findOneBy({
                                    id: productId,
                                })];
                        case 2:
                            product = _a.sent();
                            if (product) {
                                return [2 /*return*/, res.send(product)];
                            }
                            else {
                                return [2 /*return*/, res.status(404).json({ Error: '해당 제품을 찾지 못했습니다.' })];
                            }
                            return [3 /*break*/, 4];
                        case 3:
                            error_2 = _a.sent();
                            return [2 /*return*/, res.status(500).json({ error: '데이터베이스 조회 에러' })];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            //데이터베이스에 있는 기존 제품 req.body에 있는 데이터로 업데이트
            app.put('/api/products/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var productId, product, updateProduct, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 5, , 6]);
                            productId = parseInt(req.params.id, 10);
                            //유효성 검사
                            if (isNaN(productId) || productId <= 0) {
                                return [2 /*return*/, res.status(400).json({ error: "유효하지 않은 제품ID" })];
                            }
                            return [4 /*yield*/, productRepository.findOneBy({
                                    id: productId,
                                })];
                        case 1:
                            product = _a.sent();
                            if (!product) return [3 /*break*/, 3];
                            //요청 본문(req.body)의 데이터를 병합
                            productRepository.merge(product, req.body);
                            return [4 /*yield*/, productRepository.save(product)];
                        case 2:
                            updateProduct = _a.sent();
                            channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(updateProduct)));
                            return [2 /*return*/, res.send(updateProduct)];
                        case 3: return [2 /*return*/, res.status(404).json({ Error: '해당 제품을 찾지 못했습니다.' })];
                        case 4: return [3 /*break*/, 6];
                        case 5:
                            error_3 = _a.sent();
                            return [2 /*return*/, res.status(500).json({ error: "데이터베이스 처리 에러" })];
                        case 6: return [2 /*return*/];
                    }
                });
            }); });
            //데이터 삭제
            app.delete('/api/products/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, productRepository.delete(req.params.id)];
                        case 1:
                            result = _a.sent();
                            channel.sendToQueue('product_deleted', Buffer.from(req.params.id));
                            return [2 /*return*/, res.send(result)];
                    }
                });
            }); });
            //데이터베이스 제품 항목 중 likes(좋아요) 요청할때마다 카운트 1씩 증가
            app.post('/api/products/:id/like', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var productId, product, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            productId = parseInt(req.params.id, 10);
                            return [4 /*yield*/, productRepository.findOneBy({
                                    id: productId,
                                })];
                        case 1:
                            product = _a.sent();
                            product.likes++;
                            return [4 /*yield*/, productRepository.save(product)];
                        case 2:
                            result = _a.sent();
                            return [2 /*return*/, res.send(result)];
                    }
                });
            }); });
            console.log('Listening port: 8000');
            app.listen(8000);
            process.on('beforeExit', function () {
                console.log('closing');
                connection.close();
            });
        });
    });
});
