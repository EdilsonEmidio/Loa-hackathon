# TECNOLOGIAS DO SISTEMA

- Será usado Next.js
- O deploy será no Vercel
- O banco de dados será no Neon com postgres 18
- Será utilizado a autenticação do neon
- O banco terá 1 schema
- O schema secretaria_saude terá as seguintes tabelas e campos:
    - usuario
        - id int
        - email string
        - senha string
        - categoria enum ('Administrador', 'Secretaria_educação', 'Representante_escolar')

    - pedido
        - id int
        - id_usuario int
        - status enum ('em analise', 'confirmado', 'em preparo', 'a caminho', 'entregue', 'cancelado')
        - data_solicitacao datetime
        - data_confirmacao datetime
        - data_cancelamento datetime
        - data_preparo datetime
        - data_prevista_entrega datetime
        - data_entrega datetime
        - fornecedor
        - observacao string nullable

    - produto_estoque
        - id_pedido int
        - id_produto int
        - quantidade_atual int
        
    - produto
        - id int
        - nome string
        - preco decimal (10,2)
        - descricao string
        - categoria enum ('limpeza', 'higiene', 'alimento', 'material', 'outros')

    - pedido_produtos
        - id_pedido int
        - id_produto int
        - quantidade_pedida int
        - preco_total decimal (10,2)
        - fornecedor string
        - validade datetime nullable

- O sistema usará tailwind para customização
- O sistema poderá exportar em relatorios em formato .xlss
- O sistema poderá importar relatorios do formato .xlss
- O banco de dados será criado localmente e exportado para o neon