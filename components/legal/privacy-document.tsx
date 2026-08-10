import {
  LegalDocumentLayout,
  LegalSection,
} from "@/components/legal/legal-document-layout";
import { DATA_CONTROLLER } from "@/components/legal/controller-placeholder";

export function PrivacyDocument() {
  return (
    <LegalDocumentLayout
      title="Política de Privacidade"
      description="Como o Surf AI Coach trata dados pessoais, em linguagem alinhada à LGPD."
    >
      <LegalSection title="1. Quem é o responsável">
        <p>
          O tratamento é feito por <strong>{DATA_CONTROLLER.legalName}</strong>{" "}
          ({DATA_CONTROLLER.documentId}), com nome fantasia{" "}
          {DATA_CONTROLLER.tradeName}, endereço {DATA_CONTROLLER.address}.
          Contato do titular:{" "}
          <a
            className="text-primary underline-offset-4 hover:underline"
            href={`mailto:${DATA_CONTROLLER.contactEmail}`}
          >
            {DATA_CONTROLLER.contactEmail}
          </a>
          .
        </p>
        <p>
          Os dados de identificação fiscal acima são placeholders e serão
          atualizados quando a empresa/domínio estiverem definitivos.
        </p>
      </LegalSection>

      <LegalSection title="2. Quais dados tratamos">
        <ul>
          <li>
            <strong>Conta:</strong> e-mail, senha (armazenada pelo provedor de
            autenticação), nome de exibição
          </li>
          <li>
            <strong>Perfil de surf:</strong> nível, peso, altura, tipo de onda
            mais frequente
          </li>
          <li>
            <strong>Mídia:</strong> vídeos, imagens e links que você envia para
            análise
          </li>
          <li>
            <strong>Resultados de IA:</strong> feedback de performance, ficha de
            prancha e compatibilidade
          </li>
          <li>
            <strong>Pranchas:</strong> fotos e dados técnicos que você cadastra
          </li>
          <li>
            <strong>Feedback de produto:</strong> avaliações e sugestões
            enviadas no app
          </li>
          <li>
            <strong>Uso e créditos:</strong> histórico de consumo de análises e
            plano
          </li>
          <li>
            <strong>Técnicos:</strong> cookies essenciais de sessão, registros
            de erro sem dados sensíveis desnecessários
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Para que usamos">
        <p>
          Prestação do serviço (análise, prancha, compatibilidade), autenticação,
          contagem de créditos, melhoria do produto a partir de feedback,
          segurança anti-abuso e cumprimento de obrigações legais. A mídia pode
          ser enviada a modelo de IA para gerar o feedback solicitado.
        </p>
      </LegalSection>

      <LegalSection title="4. Bases legais (LGPD)">
        <p>
          Em regra: <strong>execução de contrato</strong> (conta e análises que
          você pede), <strong>legítimo interesse</strong> (segurança, melhoria
          do serviço, prevenção a abuso) e, quando aplicável,{" "}
          <strong>consentimento</strong> (ex.: aceite no cadastro e comunicações
          futuras, se houver).
        </p>
      </LegalSection>

      <LegalSection title="5. Retenção">
        <p>
          Mantemos os dados <strong>enquanto sua conta existir</strong>. Ao
          excluir a conta, removemos ou anonimizamos os dados de produto
          associados, salvo obrigação legal de retenção pontual. Ainda não há
          apagamento automático por prazo fixo além do encerramento da conta.
        </p>
      </LegalSection>

      <LegalSection title="6. Com quem compartilhamos (operadores)">
        <ul>
          <li>
            <strong>Supabase</strong> — autenticação, banco e armazenamento de
            arquivos
          </li>
          <li>
            <strong>OpenAI</strong> — processamento de visão/texto para as
            análises
          </li>
          <li>
            <strong>Sentry</strong> — monitoramento de erros da aplicação
          </li>
          <li>
            <strong>Gateway de pagamento</strong> — a definir; quando houver
            cobrança, os dados necessários ao pagamento seguirão a política
            desse provedor
          </li>
        </ul>
        <p>
          Esses provedores podem processar dados fora do Brasil. Adotamos
          salvaguardas contratuais e técnicas razoáveis; o envio ocorre para
          viabilizar o serviço que você solicita.
        </p>
      </LegalSection>

      <LegalSection title="7. Seus direitos">
        <p>Você pode, pelo app ou pelo e-mail de contato:</p>
        <ul>
          <li>Confirmar e acessar seus dados (perfil, análises, pranchas)</li>
          <li>Corrigir dados incompletos ou desatualizados</li>
          <li>Exportar um pacote com seus dados (portabilidade)</li>
          <li>Excluir a conta e os dados de produto associados</li>
          <li>Obter informação sobre compartilhamentos e bases legais</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Cookies">
        <p>
          Usamos cookies <strong>essenciais de sessão</strong> para manter você
          autenticado. Não usamos cookies de marketing nesta versão. Um aviso no
          app informa esse uso.
        </p>
      </LegalSection>

      <LegalSection title="9. Segurança">
        <p>
          Aplicamos controle de acesso por conta, armazenamento privado de
          mídia, validação de entradas e isolamento da camada de IA. Nenhum
          sistema é 100% livre de risco; reporte incidentes pelo e-mail de
          contato.
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
