import {
  LegalDocumentLayout,
  LegalSection,
} from "@/components/legal/legal-document-layout";
import { DATA_CONTROLLER } from "@/components/legal/controller-placeholder";

export function RefundDocument() {
  return (
    <LegalDocumentLayout
      title="Política de Reembolso"
      description="Regras gerais de reembolso para assinaturas e packs de créditos. Podem ser atualizadas quando o provedor de pagamento estiver definido."
    >
      <LegalSection title="1. Escopo">
        <p>
          Esta política se aplica a cobranças futuras de{" "}
          <strong>assinaturas</strong> (Surfista, Pro ou equivalentes) e{" "}
          <strong>packs avulsos de créditos</strong> no Surf AI Coach. Enquanto
          o checkout real não estiver ativo, não há cobrança — estas regras
          orientam o lançamento comercial.
        </p>
      </LegalSection>

      <LegalSection title="2. Assinaturas">
        <p>
          Você pode cancelar a renovação a qualquer momento pela área de plano
          (quando disponível) ou pelo canal de contato. O cancelamento evita
          novas cobranças no ciclo seguinte; em regra,{" "}
          <strong>não há reembolso proporcional</strong> do período já pago já
          iniciado, salvo exigência legal ou falha nossa que impeça o uso
          material do serviço.
        </p>
      </LegalSection>

      <LegalSection title="3. Packs de créditos">
        <p>
          Créditos avulsos são consumíveis. Após a compra, reembolso só será
          considerado se os créditos{" "}
          <strong>ainda não tiverem sido usados</strong> e o pedido for feito em
          até <strong>7 dias</strong> da compra, ou se houver cobrança duplicada
          / erro manifesto do sistema.
        </p>
      </LegalSection>

      <LegalSection title="4. Plano gratuito e créditos grátis">
        <p>
          Créditos do plano gratuito ou bônus não são reembolsáveis em dinheiro.
        </p>
      </LegalSection>

      <LegalSection title="5. Como solicitar">
        <p>
          Envie e-mail para{" "}
          <a
            className="text-primary underline-offset-4 hover:underline"
            href={`mailto:${DATA_CONTROLLER.contactEmail}`}
          >
            {DATA_CONTROLLER.contactEmail}
          </a>{" "}
          com o e-mail da conta, data aproximada da compra e motivo. Responderemos
          em prazo razoável. O meio de estorno seguirá o provedor de pagamento
          utilizado (a definir).
        </p>
      </LegalSection>

      <LegalSection title="6. Atualizações">
        <p>
          Podemos ajustar esta política ao integrar o gateway de pagamento e
          obrigações do consumidor aplicáveis. A data no topo indica a versão
          vigente.
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
