import { FastifyInstance } from "fastify"
import ShortUniqueId from "short-unique-id"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { authenticate } from "../plugins/authenticate"

export async function poolRoutes(fastify: FastifyInstance){
   //qtde de bolões  /pools/count
   fastify.get('/pools/count', async ()=> {
      const count = await prisma.pool.count()
      return { count }      
   })

   //criando o bolão /
   fastify.post('/pools', async (request, reply)=> {
      const createPoolBody = z.object({
         title: z.string(),
      })

      const { title } = createPoolBody.parse(request.body) 
      
      const generate = new ShortUniqueId({ length: 6 })
      const code =  String(generate()).toUpperCase();
      
      //checar se o usuário esta logado senao estiver cirar bolão anonimo
      try{
         await request.jwtVerify()

         await prisma.pool.create({
            data: {
               title,
               code,
               ownerId: request.user.sub,

               participants: {
                  create: {
                     userId: request.user.sub,
                  }
               }
            }
         })


      } catch {
         //senao estiver logado pode criar anonimo
         await prisma.pool.create({
            data: {
               title,
               code
            }
         })
      }
      
      

      return reply.status(201).send({ code })
   
        //   return { title }
   })

   //entrar num bolão (quer dizer adcionar um participant)
   fastify.post('/pools/join', {onRequest: [authenticate]}, async (request, reply)=> {
      //validacao para o code nao vim vazio
      const joinPoolBody = z.object({
         code: z.string(),
      })
         
         const { code } = joinPoolBody.parse(request.body) //recebe o body para validar 
      
         const pool = await prisma.pool.findUnique({
            where: {
               code,
            },
            //include permite fazer o join com a tabela bolao
            include: {
               participants: {
                  where: {
                     userId: request.user.sub,
                  }
               }
            }
         })
       //verificar se o bolao existe para poder entrar 
         if (!pool) {
            return reply.status(404).send({
               message: 'Pool not found.'
            })
         }
       //verificar tambem se o participante ja esta no bolão
         if (pool.participants.length > 0) {
            return reply.status(404).send({
               message: 'you already joined this pool'
            })
         }
         //se o bolao for criardo anonimo atualizar o proprietario com o primeiro usuario logado a participar
         if (!pool.ownerId) {
            await prisma.pool.update({
               where: {
                  id: pool.id,
               },
               data:{
                  ownerId: request.user.sub,
               }
            })
         }

      //se der certo curar o participante para o bolao como token logado
      await prisma.participant.create({
         data:{
            poolId: pool.id,
            userId: request.user.sub,
         }
      })
      //no fim de tudo retornar o status code 201
      return reply.status(201).send()


   })

   //retornar todos os boloes que o usuarios esta participando
   fastify.get('/pools', {onRequest: [authenticate]}, async (request) =>{
      //retornar todos os boloes que o usuarios esta participando
      const pools = await prisma.pool.findMany({
         where: {
            participants: {
               some: {
                  userId: request.user.sub,
               }
            }
         },
         include:{
            _count:{
               select: {participants: true,}
            },
            participants:{
               select: {
                  id: true,
                  user:{
                     select: {avatarUrl: true,}
                  }
               },
               take:4,
            },
            owner:{
               select:{id: true, name: true,}
            }
         }
      })
      return { pools }
   })
   //retornar bolao pelo id
   fastify.get('/pools/:id', {onRequest: [authenticate]}, async(request) =>{
      const getPoolParams = z.object({
         id: z.string(),
      })
      const { id } = getPoolParams.parse(request.params)

      const pool = await prisma.pool.findUnique({
         where: {
            id,
         },
         include:{
            _count:{
               select: {participants: true,}
            },
            participants:{
               select: {
                  id: true,
                  user:{
                     select: {avatarUrl: true,}
                  }
               },
               take:4,
            },
            owner:{
               select:{id: true, name: true,}
            }
         }
      })
      return { pool }
   })
}
