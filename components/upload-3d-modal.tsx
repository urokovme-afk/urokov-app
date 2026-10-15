"use client";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  Code2,
  FileCode,
  Loader2,
  Check,
  Pin,
  AlertCircle,
  Play,
  RotateCcw,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface Upload3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

/**
 * Оборачивает чистый JavaScript/Three.js код в готовый автономный HTML документ
 */
function wrapJsInHtml(code: string): string {
  const trimmed = code.trim();
  if (
    trimmed.toLowerCase().includes("<!doctype html") ||
    trimmed.toLowerCase().includes("<html")
  ) {
    return trimmed;
  }

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>3D Visual</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #ffffff;
    }
    canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
</head>
<body>
  <script>
    window.addEventListener('error', function(e) {
      console.error("3D Error:", e);
    });

    try {
      ${trimmed}
    } catch (err) {
      document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ef4444;font-family:monospace;font-size:12px;padding:16px;text-align:center;">Ошибка в 3D скрипте: ' + err.message + '</div>';
    }
  </script>
</body>
</html>`;
}

export function Upload3DModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: Upload3DModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"code" | "file">("code");
  const [codeContent, setCodeContent] = useState("");
  const [showLivePreview, setShowLivePreview] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"code" | "video" | "image">("code");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setErrorMsg("");

    const isHtmlOrJs =
      file.name.endsWith(".html") ||
      file.name.endsWith(".js") ||
      file.type === "text/html" ||
      file.type === "text/javascript";
    const isVid =
      file.type.startsWith("video/") ||
      /\.(mp4|webm|mov|m4v)$/i.test(file.name);

    if (isHtmlOrJs) {
      setFileType("code");
    } else if (isVid) {
      setFileType("video");
    } else {
      setFileType("image");
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "code" && !codeContent.trim()) {
      setErrorMsg("Пожалуйста, вставьте 3D JavaScript или HTML код.");
      return;
    }

    if (mode === "file" && !selectedFile) {
      setErrorMsg("Пожалуйста, выберите файл (HTML, видео или изображение).");
      return;
    }

    try {
      setUploading(true);
      setErrorMsg("");
      setProgressText("Подготовка и сохранение...");

      let fileToUpload: Blob;
      let finalExt = "html";
      let finalType: "code" | "video" | "image" = "code";

      if (mode === "code") {
        const fullHtml = wrapJsInHtml(codeContent);
        fileToUpload = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
        finalExt = "html";
        finalType = "code";
      } else {
        if (!selectedFile) throw new Error("Файл не выбран");
        fileToUpload = selectedFile;
        finalExt = selectedFile.name.split(".").pop()?.toLowerCase() || "file";
        finalType = fileType;
      }

      const cleanBase = (title || "visual")
        .replace(/[^a-zA-Z0-9_\-\u0400-\u04FF]/g, "_")
        .slice(0, 24);
      const uniqueFileName = `${Date.now()}_3d_${cleanBase}.${finalExt}`;
      const storagePath = `uploads/${uniqueFileName}`;

      setProgressText("Загрузка в хранилище...");

      // 1. Загрузка в Supabase Storage "media"
      const { error: storageError } = await supabase.storage
        .from("media")
        .upload(storagePath, fileToUpload, {
          cacheControl: "3600",
          upsert: false,
          contentType:
            finalExt === "html"
              ? "text/html"
              : finalExt === "js"
              ? "text/javascript"
              : undefined,
        });

      if (storageError) {
        throw new Error(`Ошибка хранилища: ${storageError.message}`);
      }

      // 2. Получение публичной ссылки
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(storagePath);

      setProgressText("Сохранение в базе данных...");

      // 3. Формирование заголовка и описания
      const combinedContent = [title.trim(), description.trim()]
        .filter(Boolean)
        .join("\n\n");

      // 4. Запись в таблицу posts
      const { error: dbError } = await supabase.from("posts").insert([
        {
          content: combinedContent,
          media_url: publicUrl,
          media_type: finalType,
          is_pinned: isPinned,
          created_at: new Date().toISOString(),
          views: 0,
        },
      ]);

      if (dbError) {
        throw new Error(`Ошибка базы данных: ${dbError.message}`);
      }

      // Очистка формы
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCodeContent("");
      setTitle("");
      setDescription("");
      setIsPinned(false);
      setShowLivePreview(false);

      onUploadSuccess();
      onClose();
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setErrorMsg(
        err instanceof Error ? err.message : "Не удалось сохранить работу"
      );
    } finally {
      setUploading(false);
      setProgressText("");
    }
  };

  const handleClose = () => {
    if (uploading) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setShowLivePreview(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-white border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Шапка модального окна */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-900 text-white shadow-sm">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 tracking-tight">
                Добавить 3D работу
              </h2>
              <p className="text-[11px] text-zinc-500 font-mono">
                JavaScript код, Three.js или медиа
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Переключатель вкладок (Код / Файл) */}
        <div className="px-5 pt-3.5 pb-1 flex items-center gap-2 border-b border-zinc-100 bg-white">
          <button
            type="button"
            onClick={() => setMode("code")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
              mode === "code"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Вставить 3D код (JS / Three.js)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
              mode === "file"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Загрузить файл (HTML, MP4, PNG)</span>
          </button>
        </div>

        {/* Форма */}
        <form
          onSubmit={handlePublish}
          className="p-5 overflow-y-auto flex flex-col gap-4 text-zinc-800"
        >
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Вкладка 1: Вставка кода */}
          {mode === "code" ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  3D JavaScript / Three.js код
                </label>
                {codeContent.trim() && (
                  <button
                    type="button"
                    onClick={() => setShowLivePreview(!showLivePreview)}
                    className="flex items-center gap-1 text-[11px] font-medium text-cyan-600 hover:text-cyan-700 transition"
                  >
                    {showLivePreview ? (
                      <>
                        <RotateCcw className="w-3 h-3" />
                        <span>Вернуться к коду</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-cyan-600" />
                        <span>Тест предпросмотра</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {showLivePreview ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-200 bg-white shadow-inner">
                  <iframe
                    srcDoc={wrapJsInHtml(codeContent)}
                    title="Live 3D Preview"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    rows={7}
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    placeholder={`// Вставьте сюда Three.js код от AI или собственный скрипт...\n// Например:\nconst scene = new THREE.Scene();\nconst camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);\nconst renderer = new THREE.WebGLRenderer({ antialias: true });\n// Скрипт будет автоматически запущен прямо в браузере!`}
                    className="w-full font-mono text-xs p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:bg-white transition resize-none leading-relaxed"
                  />
                  <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
                    Three.js и OrbitControls уже подключены автоматически.
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Вкладка 2: Загрузка готового файла */
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                Файл работы (.html, .mp4, .png)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.js,video/mp4,video/webm,image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-200 hover:border-zinc-400 bg-zinc-50 hover:bg-zinc-100/70 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center group"
                >
                  <div className="p-3 rounded-full bg-white border border-zinc-200 shadow-sm group-hover:scale-105 transition">
                    <FileCode className="w-5 h-5 text-zinc-600" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700">
                    Нажмите для выбора файла или перетащите сюда
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    HTML, JS, MP4, WEBM, PNG, JPG
                  </span>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 aspect-video flex items-center justify-center p-2">
                  {fileType === "code" ? (
                    <iframe
                      src={previewUrl}
                      title="File Preview"
                      className="w-full h-full border-0 rounded-lg pointer-events-none"
                    />
                  ) : fileType === "video" ? (
                    <video
                      src={previewUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 text-zinc-600 hover:text-black border border-zinc-200 shadow-sm transition"
                    title="Заменить файл"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Название */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Название работы
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Вращающаяся спираль #01"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:bg-white transition"
            />
          </div>

          {/* Описание и теги */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Описание или теги
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="#ThreeJS #Spiral #Shader #Particles"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:bg-white transition resize-none"
            />
          </div>

          {/* Закрепить в начале */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none py-0.5">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded accent-zinc-900 border-zinc-300"
            />
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium">
              <Pin className="w-3 h-3 text-cyan-600 rotate-45" />
              <span>Закрепить вверху галереи</span>
            </div>
          </label>

          {/* Кнопка отправки */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold text-xs tracking-wide transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{progressText || "Сохранение..."}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Опубликовать в галерее</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
