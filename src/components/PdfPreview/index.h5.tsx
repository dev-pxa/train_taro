import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from '@tarojs/components';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Icon from '../Icon';
import { getResourceAuthOptions } from '../../services/resourceRequest';

if (typeof window !== 'undefined' && 'Worker' in window && !pdfjsLib.GlobalWorkerOptions.workerPort) {
  pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
    new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url),
    { type: 'module' },
  );
}

type PdfPreviewProps = {
  url: string;
  title?: string;
};

type PreviewStatus = 'loading' | 'ready' | 'error';

export default function PdfPreview({ url, title }: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadingTaskRef = useRef<any>(null);
  const [status, setStatus] = useState<PreviewStatus>('loading');
  const [message, setMessage] = useState('正在加载PDF');
  const [pageCount, setPageCount] = useState(0);
  const [renderedPages, setRenderedPages] = useState(0);

  const openInNewTab = () => {
    if (typeof window !== 'undefined' && url) {
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    let cancelled = false;
    const root = containerRef.current;
    if (!root) return undefined;

    root.innerHTML = '';
    setStatus('loading');
    setMessage('正在加载PDF');
    setPageCount(0);
    setRenderedPages(0);

    if (!url) {
      setStatus('error');
      setMessage('缺少PDF地址');
      return undefined;
    }

    const renderPdf = async () => {
      try {
        const { header, credentials } = await getResourceAuthOptions(url);
        const response = await fetch(url, { headers: header, credentials });
        if (!response.ok) {
          throw new Error(`PDF下载失败：${response.status}`);
        }

        const pdfData = new Uint8Array(await response.arrayBuffer());
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        loadingTaskRef.current = loadingTask;
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        setPageCount(pdf.numPages);
        const containerWidth = Math.max(root.clientWidth || window.innerWidth || 375, 320);
        const deviceScale = Math.min(window.devicePixelRatio || 1, 2);

        for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
          if (cancelled) break;

          const page = await pdf.getPage(pageNo);
          const originalViewport = page.getViewport({ scale: 1 });
          const scale = containerWidth / originalViewport.width;
          const viewport = page.getViewport({ scale });

          const pageWrap = document.createElement('div');
          pageWrap.className = 'pdf-page';

          const pageLabel = document.createElement('div');
          pageLabel.className = 'pdf-page-label';
          pageLabel.innerText = `${pageNo} / ${pdf.numPages}`;

          const canvas = document.createElement('canvas');
          canvas.className = 'pdf-canvas';
          canvas.width = Math.floor(viewport.width * deviceScale);
          canvas.height = Math.floor(viewport.height * deviceScale);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          pageWrap.appendChild(pageLabel);
          pageWrap.appendChild(canvas);
          root.appendChild(pageWrap);

          const context = canvas.getContext('2d');
          if (!context) {
            throw new Error('Canvas初始化失败');
          }
          context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);

          await page.render({ canvasContext: context, viewport }).promise;
          page.cleanup();
          if (!cancelled) {
            setRenderedPages(pageNo);
          }
        }

        if (!cancelled) {
          setStatus('ready');
          setMessage(title || 'PDF预览');
        }
      } catch (error) {
        if (cancelled) return;
        console.error('PDF preview failed:', error);
        setStatus('error');
        setMessage('PDF加载失败，请检查文件地址或跨域配置');
      }
    };

    renderPdf();

    return () => {
      cancelled = true;
      loadingTaskRef.current?.destroy?.();
      loadingTaskRef.current = null;
      root.innerHTML = '';
    };
  }, [title, url]);

  return (
    <View className="pdf-preview">
      <View className="resource-title-bar">
        <Text className="resource-title">{title || 'PDF预览'}</Text>
        <View className="resource-action" onClick={openInNewTab}><Icon name="Share" /> 打开文件</View>
      </View>
      <ScrollView scrollY className="pdf-preview-scroll">
        {status !== 'ready' && (
          <View className={`pdf-preview-status pdf-preview-status-${status}`}>
            <Text className="pdf-preview-status-title">{message}</Text>
            {status === 'loading' && pageCount > 0 && (
              <Text className="pdf-preview-status-desc">已渲染 {renderedPages} / {pageCount} 页</Text>
            )}
            {status === 'error' && (
              <Text className="pdf-preview-status-desc">H5内嵌预览需要PDF资源允许跨域访问</Text>
            )}
          </View>
        )}
        <View ref={containerRef} className="pdf-preview-pages" />
        <View className="safe-bottom" />
      </ScrollView>
    </View>
  );
}
