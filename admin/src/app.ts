import * as express from 'express';
import { Request, Response } from 'express';
import * as cors from 'cors';
import { DataSource } from 'typeorm';
import { Product } from './entity/product';
import * as amqp from 'amqplib/callback_api';
import { channel } from 'diagnostics_channel';

const AppDataSource = new DataSource({
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
})

AppDataSource.initialize()
    .then(db => { // 이 콜백 함수에서 db 매개변수로 데이터베이스 연결 객체를 사용할 수 있음
        const app = express();

        const productRepository = db.getRepository(Product);

        amqp.connect('amqps://hvqmbjdq:OaEWP5JYid10szxBBIVIXGwG5JHn8Y22@gerbil.rmq.cloudamqp.com/hvqmbjdq', (error0, connection) => {
            if (error0) {
                throw error0
            }

            connection.createChannel((error1, channel) => {
                if (error1) {
                    throw error0
                }
                app.use(cors({
                    origin: ['http://localhost:3000','http://localhost:8080','http://localhost:4200']
                }));
                
                app.use(express.json());
        
                //데이터베이스 product 테이블 전체 조회
                app.get('/api/products', async (req: Request, res:Response) => {
                    const products = await productRepository.find();
                    channel.sendToQueue('hello', Buffer.from('hello'));
                    res.json(products);
                });
         
                //데이터베이스 새 데이터 생성 
                app.post('/api/products', async (req: Request, res:Response) => {
                    try {
                        const product = await productRepository.create(req.body);

                        if (product) {
                            const result = await productRepository.save(product)
                            channel.sendToQueue('product_created', Buffer.from(JSON.stringify(result)))
                            return res.send(result)
                        } else {
                            return res.status(404).json({ Error: '해당 제품을 찾지 못했습니다.'});
                        }
                    } catch (error) {
                        return res.status(500).json({ error: '데이터베이스 조회 에러'});
                    }
                });
        
                //데이터베이스에 있는 제품들중 단일 제품 검색
                app.get('/api/products/:id', async (req: Request, res:Response) => {
                   const productId = parseInt(req.params.id, 10);
        
                   try {
                    const product = await productRepository.findOneBy({
                        id: productId,
                    })
                    if (product) {
                        return res.send(product);
                    } else {
                        return res.status(404).json({ Error: '해당 제품을 찾지 못했습니다.'});
                    }
                   }  catch (error) {
                        return res.status(500).json({ error: '데이터베이스 조회 에러'});
                   }
                });
        
                //데이터베이스에 있는 기존 제품 req.body에 있는 데이터로 업데이트
                app.put('/api/products/:id', async (req: Request, res: Response) => {
                    try {
                        const productId = parseInt(req.params.id, 10);
        
                        //유효성 검사
                        if (isNaN(productId) || productId <= 0) {
                            return res.status(400).json({ error: "유효하지 않은 제품ID"})
                        }
        
                        //데이터베이스에서 해당 제품 조회
                        const product = await productRepository.findOneBy({
                            id: productId,
                        })
                        if (product) {
                            //요청 본문(req.body)의 데이터를 병합
                            productRepository.merge(product, req.body)
            
                            //제품을 업데이트하고 결과를 반환
                            const updateProduct = await productRepository.save(product)
                            channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(updateProduct)))
                            return res.send(updateProduct);
                        } else {
                            return res.status(404).json({ Error: '해당 제품을 찾지 못했습니다.'});
                        } 
                    } catch (error) {
                      return res.status(500).json({ error: "데이터베이스 처리 에러"})
                    } 
                });
        
                //데이터 삭제
                app.delete('/api/products/:id', async (req: Request, res: Response) => {
                    const result = await productRepository.delete(req.params.id)
                    channel.sendToQueue('product_deleted', Buffer.from(req.params.id))
                    return res.send(result);
                })
        
                //데이터베이스 제품 항목 중 likes(좋아요) 요청할때마다 카운트 1씩 증가
                app.post('/api/products/:id/like', async (req: Request, res: Response) => {
                    const productId = parseInt(req.params.id, 10);
                    
                    const product = await productRepository.findOneBy({
                        id : productId,
                    })
                    product.likes++
                    const result = await productRepository.save(product)
                    return res.send(result);
                })
                
                
                console.log('Listening port: 8000');
                
                app.listen(8000);
                process.on('beforeExit', () => {
                    console.log('closing')
                    connection.close()
                })  
            })
        });        
    })