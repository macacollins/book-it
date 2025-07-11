import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from "vite-plugin-pwa";
import fs from 'fs';
import { join } from "node:path";
import { buildSync } from "esbuild";
interface OutputAsset {
	fileName: string;
	names: string[];
	needsCodeReference: boolean;
	originalFileNames: string[];
	source: string | Uint8Array;
	type: 'asset';
}

interface OutputChunk {
	code: string;
	dynamicImports: string[];
	exports: string[];
	facadeModuleId: string | null;
	fileName: string;
	implicitlyLoadedBefore: string[];
	imports: string[];
	importedBindings: { [imported: string]: string[] };
	isDynamicEntry: boolean;
	isEntry: boolean;
	isImplicitEntry: boolean;
	map: SourceMap | null;
	modules: {
		[id: string]: {
			renderedExports: string[];
			removedExports: string[];
			renderedLength: number;
			originalLength: number;
			code: string | null;
		};
	};
	moduleIds: string[];
	name: string;
	preliminaryFileName: string;
	referencedFiles: string[];
	sourcemapFileName: string | null;
	type: 'chunk';
}

function writeAssetNames() {
	return {
		name: "write asset names",
		generateBundle(options, bundle, isWrite) {
			let css, js, sw;
			Object.keys(bundle).forEach(key => {
				
				if (key.indexOf("index-") !== -1) {
					if (key.endsWith("css")) {
						css = key;
					}
					if (key.endsWith("js")) {
						js = key;
					}
				}

				if (key.indexOf("service-worker-") !== -1) {
					sw = key;
				}
			})

			this.emitFile({
				type: 'asset',
				fileName: "js.txt",
				source: js
			});

			this.emitFile({
				type: 'asset',
				fileName: "css.txt",
				source: css
			});
		}
	};
}

export default defineConfig({
  plugins: [
    react(),
	writeAssetNames(),
    {
	  name: "write-service=worker",
      apply: "build",
      enforce: "post",
      transformIndexHtml() {
        buildSync({
          minify: true,
          bundle: true,
          entryPoints: [join(process.cwd(), "src", "service-worker.js")],
          outfile: join(process.cwd(), "src", "dist", "service-worker.js"),
        });
      },
    },

  ],
  base: './',
  server: {
    host: true
  },
  root: "./src"
  },
  
)