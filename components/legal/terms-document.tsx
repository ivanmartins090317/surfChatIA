import {
  LegalDocumentLayout,
  LegalSection,
} from "@/components/legal/legal-document-layout";
import { DATA_CONTROLLER } from "@/components/legal/controller-placeholder";
import { PRODUCT_NAME } from "@/lib/brand";

export function TermsDocument() {
  return (
    <LegalDocumentLayout
      title="Termos de Uso"
      description="Regras de uso do Surf AI Coach, limites de créditos e responsabilidade da análise por IA."
    >
      <LegalSection title="1. Aceite">
        <p>
          Ao criar conta ou usar o {PRODUCT_NAME}, você concorda
          com estes Termos e com a Política de Privacidade. Se não concordar,
          não utilize o serviço.
        </p>
      </LegalSection>

      <LegalSection title="2. O serviço">
        <p>
          O Surf AI Coach oferece feedback técnico de performance a partir de
          vídeos, imagens ou links, ficha da prancha mágica e análise de
          compatibilidade de prancha, com apoio de inteligência artificial.
        </p>
        <p>
          O conteúdo gerado pela IA é <strong>orientativo</strong>. Não
          substitui coach presencial, shaper, médico ou outro profissional. Você
          é responsável pelas decisões de treino, compra de equipamento e
          segurança na água.
        </p>
      </LegalSection>

      <LegalSection title="3. Conta e uso pessoal">
        <p>
          A conta é pessoal e intransferível. Você deve informar dados
          verdadeiros no perfil e manter a senha em sigilo. Uso comercial como
          coach/shaper multi-aluno pode exigir plano adequado quando disponível.
        </p>
      </LegalSection>

      <LegalSection title="4. Créditos, planos e uso justo (fair use)">
        <p>
          Análises consomem <strong>créditos</strong>. Referência atual de
          cotas (sujeita a atualização na página de planos):
        </p>
        <ul>
          <li>
            <strong>Grátis:</strong> 2 créditos no total para novos cadastros
          </li>
          <li>
            <strong>Surfista:</strong> 8 créditos por mês
          </li>
          <li>
            <strong>Pro:</strong> 30 créditos por mês
          </li>
          <li>
            <strong>Packs avulsos:</strong> conforme oferta publicada (ex.: 5 ou
            15 créditos)
          </li>
        </ul>
        <p>
          Não prometemos uso “ilimitado”. Abuso (automação, compartilhamento de
          conta, sobrecarga intencional da IA ou armazenamento) pode resultar em
          limitação, suspensão ou encerramento da conta, sem prejuízo das
          cotas contratadas.
        </p>
        <p>
          Falha de sistema na análise não consome crédito. Reanálise voluntária
          do mesmo conteúdo consome crédito quando concluída com sucesso.
        </p>
      </LegalSection>

      <LegalSection title="5. Conteúdo enviado">
        <p>
          Você declara ter direito de enviar as mídias (vídeos, fotos, links) e
          que elas não violam direitos de terceiros nem a lei. Não envie
          conteúdo ilegal, ofensivo ou que exponha menores de forma inadequada.
        </p>
      </LegalSection>

      <LegalSection title="6. Disponibilidade e alterações">
        <p>
          Nos esforçamos para manter o serviço estável, mas ele pode sofrer
          interrupções, manutenção ou mudanças de funcionalidade. Podemos
          atualizar estes Termos; a data no topo indica a versão vigente.
        </p>
      </LegalSection>

      <LegalSection title="7. Encerramento">
        <p>
          Você pode excluir sua conta a qualquer momento pelas configurações de
          perfil. Podemos encerrar ou suspender o acesso em caso de violação
          destes Termos ou risco à operação/segurança.
        </p>
      </LegalSection>

      <LegalSection title="8. Contato">
        <p>
          Dúvidas:{" "}
          <a
            className="text-primary underline-offset-4 hover:underline"
            href={`mailto:${DATA_CONTROLLER.contactEmail}`}
          >
            {DATA_CONTROLLER.contactEmail}
          </a>
          . Responsável: {DATA_CONTROLLER.legalName} ({DATA_CONTROLLER.documentId}
          ), sede em {DATA_CONTROLLER.headquarters}.
        </p>
      </LegalSection>
    </LegalDocumentLayout>
  );
}
