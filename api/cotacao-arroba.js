// Função serverless da Vercel — busca a cotação da arroba do boi gordo
// em Nova Xavantina-MT (dado publicado pelo IMEA, replicado diariamente
// pelo portal CenárioMT). Roda no servidor para evitar bloqueio de CORS
// no navegador. Se a fonte mudar de layout ou sair do ar, retorna um erro
// e o app deixa o usuário digitar o valor manualmente.

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');

  try {
    const resposta = await fetch('https://cenariomt.com.br/cotacao-boi-gordo/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
      }
    });

    if (!resposta.ok) {
      throw new Error('Não foi possível acessar a fonte de cotação agora (status ' + resposta.status + ').');
    }

    const html = await resposta.text();
    const texto = html
      .replace(/&nbsp;|&#160;/g, ' ')
      .replace(/<[^>]+>/g, ' ');

    const match = texto.match(/Nova\s*Xavantina[\s\S]{0,150}?(\d{2,3}[.,]\d{2})/i);
    if (!match) {
      throw new Error('Não foi possível localizar a cotação de Nova Xavantina na página de origem.');
    }

    const valor = parseFloat(match[1].replace(',', '.'));
    if (!valor || isNaN(valor)) {
      throw new Error('Valor de cotação inválido recebido da fonte.');
    }

    res.status(200).json({
      ok: true,
      municipio: 'Nova Xavantina - MT',
      valor: valor,
      fonte: 'IMEA (via CenárioMT)',
      consultadoEm: new Date().toISOString()
    });
  } catch (erro) {
    res.status(502).json({
      ok: false,
      erro: erro.message || 'Erro ao buscar a cotação da arroba.'
    });
  }
};
