import { Layout } from "@/components/layout/Layout";
import { ConvertTool } from "@/components/tools/ConvertTool";
import { FileDropzone } from "@/components/common/FileDropzone";

export function ConvertPage() {
  return (
    <Layout>
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">Converter arquivos</h1>
        <p className="mt-2 text-muted-foreground">
          PDF para Word, texto, imagens, HTML, XML e XPS — ou documentos e imagens para PDF.
        </p>
        <div className="mt-8 space-y-8">
          <FileDropzone />
          <ConvertTool />
        </div>
      </div>
    </Layout>
  );
}