```markdown
# Documentação da API de Pagamentos

## Descrição
Esta documentação descreve como utilizar a API de Pagamentos da Cloud Payments para criar e consultar pagamentos. A API suporta operações como criação de um novo pagamento e consulta de detalhes de um pagamento existente.

## Endpoints

### Criar um Novo Pagamento

**URL**: `https://api.cloud-payments.net/api/v1/payments`

**Método HTTP**: `POST`

**Cabeçalhos**:
- `authorization`: Token de autorização para autenticação. Formato: `Base64(<api_key>:<label>)`
- `Content-Type`: `application/json`

**Corpo da Requisição** (JSON):
```json
{
    "documentnumber": "00000000",
    "customername": "NOME SOBRENOME",
    "email": "email@example.com",
    "amount": 5
}
```

### Consultar um Pagamento

**URL**: `https://api.cloud-payments.net/api/v1/payments/{id}`

**Método HTTP**: `GET`

**Parâmetros de URL**:
- `id`: ID do pagamento que deseja consultar.

**Cabeçalhos**:
- `authorization`: Token de autorização para autenticação. Formato: `Base64(<api_key>:<label>)`

**Exemplo de Comando cURL**:
```bash
curl --location 'https://api.cloud-payments.net/api/v1/payments/12411' \
--header 'authorization: '
```

**Nota:** A página administrativa associada a esta API ainda está em desenvolvimento e não está completamente finalizada, mas está 80% completa.
```
