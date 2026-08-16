import { Layout } from "@/components/layout/Layout";
import { MergeTool } from "@/components/tools/MergeTool";
import { FileDropzone } from "@/components/common/FileDropzone";

export function MergePage() {
  return (
    <Layout>
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">Mesclar PDFs</h1>
        <p className="mt-2 text-muted-foreground">
          Envie dois ou mais arquivos, ordene como quiser e gere um único documento.
        </p>
        <div className="mt-8 space-y-8">
          <FileDropzone />
          <MergeTool />
        </div>
      </div>
    </Layout>
  );
}