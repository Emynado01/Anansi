"use client";

import { useMemo, useState } from "react";
import { z } from "zod";

interface CategoryOption {
  id: string;
  name: string;
}

interface ChapterFormValue {
  id?: string;
  title: string;
  description?: string | null;
  audioKey?: string | null;
  audioUrl: string;
  coverKey?: string | null;
  coverUrl?: string | null;
  durationSec: number;
  isPreview?: boolean;
  order?: number;
}

interface AudiobookItem {
  id: string;
  slug?: string | null;
  title: string;
  subtitle?: string | null;
  author: string;
  narrator?: string | null;
  storageFolder?: string | null;
  durationSec: number;
  tag: string;
  language: string | null;
  mood: string | null;
  audioKey?: string | null;
  audioUrl?: string | null;
  coverUrl: string | null;
  coverKey?: string | null;
  summary: string | null;
  isFeatured?: boolean;
  isPublished?: boolean;
  categories: CategoryOption[];
  chapters: ChapterFormValue[];
}

const isAbsoluteUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const chapterSchema = z.object({
  title: z.string().min(1, "Titre du chapitre requis"),
  description: z.string().optional(),
  audioKey: z.string().optional(),
  audioUrl: z
    .string()
    .optional()
    .refine((value) => !value || isAbsoluteUrl(value) || value.startsWith("/"), {
      message: "URL audio invalide",
    }),
  coverKey: z.string().optional(),
  coverUrl: z
    .string()
    .optional()
    .refine((value) => !value || isAbsoluteUrl(value) || value.startsWith("/"), {
      message: "URL couverture de chapitre invalide",
    }),
  durationSec: z.coerce.number().min(1, "Durée du chapitre requise"),
  isPreview: z.boolean().optional(),
  order: z.number().optional(),
}).superRefine((chapter, ctx) => {
  if (!chapter.audioKey && !chapter.audioUrl) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ajoutez un audio ou une clé S3 pour chaque chapitre." });
  }
});

const formSchema = z.object({
  slug: z.string().optional(),
  title: z.string().min(2, "Titre trop court"),
  subtitle: z.string().optional(),
  author: z.string().min(2, "Auteur invalide"),
  narrator: z.string().optional(),
  storageFolder: z.string().min(1, "Dossier S3 requis"),
  durationSec: z.coerce.number().min(1),
  tag: z.string().min(1, "Tag requis"),
  language: z.string().optional(),
  mood: z.string().optional(),
  audioKey: z.string().optional(),
  audioUrl: z.string().optional(),
  coverKey: z.string().optional(),
  coverUrl: z
    .string()
    .optional()
    .refine((value) => !value || isAbsoluteUrl(value) || value.startsWith("/"), {
      message: "URL couverture invalide",
    }),
  summary: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  categories: z.array(z.string()),
  chapters: z.array(chapterSchema).min(1, "Ajoutez au moins un chapitre audio"),
});

const emptyForm = {
  slug: "",
  title: "",
  subtitle: "",
  author: "Anansi",
  narrator: "",
  storageFolder: "",
  durationSec: 300,
  tag: "Livre audio",
  language: "Français",
  mood: "",
  audioKey: "",
  audioUrl: "",
  coverKey: "",
  coverUrl: "",
  summary: "",
  isFeatured: true,
  isPublished: true,
  categories: [] as string[],
  chapters: [
    {
      title: "Intro",
      description: "",
      audioKey: "",
      audioUrl: "",
      coverKey: "",
      coverUrl: "",
      durationSec: 180,
      isPreview: true,
      order: 0,
    },
  ] as ChapterFormValue[],
};

interface AdminAudiobookTableProps {
  audiobooks: AudiobookItem[];
  categories: CategoryOption[];
}

const AdminAudiobookTable = ({ audiobooks, categories }: AdminAudiobookTableProps) => {
  const [items, setItems] = useState(audiobooks);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [uploading, setUploading] = useState<string | null>(null);

  const selectedName = useMemo(() => {
    if (!editingId) return "Nouveau livre";
    const item = items.find((entry) => entry.id === editingId);
    return item ? `Modifier ${item.title}` : "Modifier";
  }, [editingId, items]);

  const currentFolder = formData.storageFolder || slugify(formData.slug || formData.title) || "nouveau-livre";

  const setField = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateChapter = (index: number, patch: Partial<ChapterFormValue>) => {
    setFormData((prev) => {
      const chapters = [...prev.chapters];
      if (!chapters[index]) return prev;
      chapters[index] = { ...chapters[index], ...patch };
      const durationSec = chapters.reduce((sum, chapter) => sum + Number(chapter.durationSec || 0), 0);
      return { ...prev, chapters, durationSec: durationSec || prev.durationSec };
    });
  };

  const uploadFile = async (file: File, type: "image" | "audio", target: string, chapterIndex?: number) => {
    const body = new FormData();
    body.set("file", file);
    body.set("type", type);
    body.set("bookFolder", currentFolder);

    setUploading(target);
    setError(null);
    try {
      const response = await fetch("/api/upload", { method: "POST", body });
      if (!response.ok) {
        throw new Error("upload_failed");
      }
      const uploaded = (await response.json()) as { key: string; url: string | null };
      if (target === "book-cover") {
        setFormData((prev) => ({ ...prev, coverKey: uploaded.key, coverUrl: uploaded.url ?? "" }));
      } else if (target === "chapter-audio" && chapterIndex !== undefined) {
        updateChapter(chapterIndex, { audioKey: uploaded.key, audioUrl: uploaded.url ?? "" });
      } else if (target === "chapter-cover" && chapterIndex !== undefined) {
        updateChapter(chapterIndex, { coverKey: uploaded.key, coverUrl: uploaded.url ?? "" });
      }
      setSuccess("Fichier envoyé vers S3.");
    } catch (err) {
      console.error(err);
      setError("Échec de l’envoi vers S3.");
    } finally {
      setUploading(null);
    }
  };

  const openModal = (id?: string) => {
    setSuccess(null);
    setError(null);
    if (id) {
      const item = items.find((entry) => entry.id === id);
      if (!item) return;
      const chapters = item.chapters.length
        ? item.chapters.map((chapter, index) => ({ ...chapter, order: index }))
        : emptyForm.chapters;
      setEditingId(id);
      setFormData({
        slug: item.slug ?? "",
        title: item.title,
        subtitle: item.subtitle ?? "",
        author: item.author,
        narrator: item.narrator ?? "",
        storageFolder: item.storageFolder ?? item.slug ?? slugify(item.title),
        durationSec: item.durationSec,
        tag: item.tag,
        language: item.language ?? "",
        mood: item.mood ?? "",
        audioKey: item.audioKey ?? chapters[0]?.audioKey ?? "",
        audioUrl: item.audioUrl ?? chapters[0]?.audioUrl ?? "",
        coverKey: item.coverKey ?? "",
        coverUrl: item.coverUrl ?? "",
        summary: item.summary ?? "",
        isFeatured: Boolean(item.isFeatured),
        isPublished: item.isPublished ?? true,
        categories: item.categories.map((category) => category.id),
        chapters,
      });
    } else {
      setEditingId(null);
      setFormData({ ...emptyForm });
    }
    setIsModalOpen(true);
  };

  const addChapter = () => {
    setFormData((prev) => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        {
          title: `Chapitre ${prev.chapters.length + 1}`,
          description: "",
          audioKey: "",
          audioUrl: "",
          coverKey: "",
          coverUrl: "",
          durationSec: 180,
          isPreview: false,
          order: prev.chapters.length,
        },
      ],
    }));
  };

  const removeChapter = (index: number) => {
    setFormData((prev) => {
      if (prev.chapters.length <= 1) return prev;
      const chapters = prev.chapters.filter((_, chapterIndex) => chapterIndex !== index).map((chapter, order) => ({ ...chapter, order }));
      const durationSec = chapters.reduce((sum, chapter) => sum + Number(chapter.durationSec || 0), 0);
      return { ...prev, chapters, durationSec };
    });
  };

  const handleDelete = async (id: string) => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/audiobooks/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("delete_error");
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSuccess("Livre supprimé.");
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer ce livre.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const orderedChapters = formData.chapters.map((chapter, order) => ({
      ...chapter,
      order,
      description: chapter.description?.trim() || undefined,
      audioKey: chapter.audioKey?.trim() || undefined,
      audioUrl: chapter.audioUrl?.trim() || undefined,
      coverKey: chapter.coverKey?.trim() || undefined,
      coverUrl: chapter.coverUrl?.trim() || undefined,
    }));
    const durationSec = orderedChapters.reduce((sum, chapter) => sum + Number(chapter.durationSec || 0), 0);
    const payload = {
      ...formData,
      slug: formData.slug?.trim() || slugify(formData.title),
      storageFolder: slugify(formData.storageFolder || formData.slug || formData.title),
      subtitle: formData.subtitle?.trim() || undefined,
      narrator: formData.narrator?.trim() || undefined,
      language: formData.language?.trim() || undefined,
      mood: formData.mood?.trim() || undefined,
      summary: formData.summary?.trim() || undefined,
      coverKey: formData.coverKey?.trim() || undefined,
      coverUrl: formData.coverUrl?.trim() || undefined,
      audioKey: orderedChapters[0]?.audioKey || undefined,
      audioUrl: orderedChapters[0]?.audioUrl || undefined,
      durationSec,
      chapters: orderedChapters,
    };

    const validation = formSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Données invalides");
      return;
    }

    setIsSubmitting(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/audiobooks/${editingId}` : "/api/audiobooks";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "request_failed");
      }

      const data = (await response.json()) as { audiobook: AudiobookItem };
      setItems((prev) => editingId ? prev.map((item) => (item.id === editingId ? data.audiobook : item)) : [data.audiobook, ...prev]);
      setSuccess(editingId ? "Livre mis à jour." : "Livre créé.");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("Impossible d’enregistrer ce livre.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">Bibliothèque audio</h2>
        <button
          type="button"
          onClick={() => openModal()}
          className="rounded-[8px] border border-brand-300 bg-brand-300 px-4 py-2 text-sm font-bold text-black shadow-glow transition hover:bg-brand-200"
        >
          Ajouter un livre
        </button>
      </div>

      {error && <p className="rounded-[8px] border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">{error}</p>}
      {success && <p className="rounded-[8px] border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">{success}</p>}

      <div className="overflow-hidden rounded-[8px] border border-zinc-200 bg-white/90 shadow-sm dark:border-white/10 dark:bg-black/50">
        <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-white/10">
          <thead className="bg-zinc-100/70 dark:bg-white/5">
            <tr>
              <th className="px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Titre</th>
              <th className="px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Dossier S3</th>
              <th className="px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Chapitres</th>
              <th className="px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">État</th>
              <th className="px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
            {items.map((book) => (
              <tr key={book.id} className="hover:bg-brand-50/50 dark:hover:bg-brand-300/5">
                <td className="px-4 py-3">
                  <p className="font-semibold text-zinc-900 dark:text-white">{book.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{book.author}</p>
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{book.storageFolder ?? book.slug ?? "-"}</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{book.chapters.length}</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{book.isPublished ? "Publié" : "Brouillon"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openModal(book.id)} className="rounded-[8px] border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:border-brand-400 hover:text-brand-600 dark:border-white/10 dark:text-zinc-200">
                      Modifier
                    </button>
                    <button type="button" onClick={() => handleDelete(book.id)} disabled={isSubmitting} className="rounded-[8px] border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-5xl rounded-[8px] border border-brand-300/30 bg-zinc-950 p-6 text-white shadow-2xl shadow-brand-500/20">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedName}</h3>
                <p className="text-xs uppercase text-brand-200">S3: osmos-files/Anansi/{currentFolder}/</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-[8px] border border-white/10 px-3 py-1 text-sm text-zinc-300 transition hover:text-white">
                Fermer
              </button>
            </div>

            <form className="max-h-[75vh] space-y-5 overflow-y-auto pr-1" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-3">
                <TextField label="Titre" value={formData.title} onChange={(value) => setField("title", value)} required />
                <TextField label="Slug" value={formData.slug} onChange={(value) => setField("slug", value)} placeholder="boss-volume-1" />
                <TextField label="Dossier S3" value={formData.storageFolder} onChange={(value) => setField("storageFolder", slugify(value))} placeholder="boss-volume-1" />
                <TextField label="Sous-titre" value={formData.subtitle} onChange={(value) => setField("subtitle", value)} />
                <TextField label="Auteur" value={formData.author} onChange={(value) => setField("author", value)} required />
                <TextField label="Narrateur" value={formData.narrator} onChange={(value) => setField("narrator", value)} />
                <TextField label="Tag" value={formData.tag} onChange={(value) => setField("tag", value)} required />
                <TextField label="Langue" value={formData.language} onChange={(value) => setField("language", value)} />
                <TextField label="Ambiance" value={formData.mood} onChange={(value) => setField("mood", value)} />
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr,1fr]">
                <div className="space-y-2 rounded-[8px] border border-white/10 bg-white/5 p-4">
                  <label className="text-xs font-semibold uppercase text-zinc-400">Couverture du livre</label>
                  <input type="file" accept="image/*" onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) void uploadFile(file, "image", "book-cover");
                    event.currentTarget.value = "";
                  }} />
                  <TextField label="Clé S3 couverture" value={formData.coverKey} onChange={(value) => setField("coverKey", value)} placeholder="Anansi/boss/images/cover.png" />
                  <TextField label="URL couverture" value={formData.coverUrl} onChange={(value) => setField("coverUrl", value)} />
                  {uploading === "book-cover" && <p className="text-xs text-brand-200">Envoi de la couverture...</p>}
                </div>
                <div className="space-y-2 rounded-[8px] border border-white/10 bg-white/5 p-4">
                  <label className="text-xs font-semibold uppercase text-zinc-400">Résumé</label>
                  <textarea value={formData.summary} onChange={(event) => setField("summary", event.target.value)} rows={8} className="w-full rounded-[8px] border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-300" />
                  <div className="flex flex-wrap gap-4 pt-2 text-sm">
                    <label className="inline-flex items-center gap-2"><input type="checkbox" checked={formData.isFeatured} onChange={(event) => setField("isFeatured", event.target.checked)} /> Mis en avant</label>
                    <label className="inline-flex items-center gap-2"><input type="checkbox" checked={formData.isPublished} onChange={(event) => setField("isPublished", event.target.checked)} /> Publié</label>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-[8px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">Chapitres</h4>
                    <p className="text-xs text-zinc-400">Audio obligatoire. Couverture de chapitre optionnelle.</p>
                  </div>
                  <button type="button" onClick={addChapter} className="rounded-[8px] border border-brand-300/60 px-3 py-2 text-xs font-bold text-brand-100 transition hover:bg-brand-300/10">
                    Ajouter un chapitre
                  </button>
                </div>

                {formData.chapters.map((chapter, index) => (
                  <div key={chapter.id ?? index} className="space-y-3 rounded-[8px] border border-white/10 bg-black/30 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Chapitre {index + 1}</p>
                      <button type="button" onClick={() => removeChapter(index)} disabled={formData.chapters.length <= 1} className="text-xs font-semibold text-red-300 disabled:opacity-40">
                        Supprimer
                      </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <TextField label="Titre" value={chapter.title} onChange={(value) => updateChapter(index, { title: value })} />
                      <NumberField label="Durée sec." value={chapter.durationSec} onChange={(value) => updateChapter(index, { durationSec: value })} />
                      <label className="flex items-end gap-2 pb-2 text-sm text-zinc-300">
                        <input type="checkbox" checked={Boolean(chapter.isPreview)} onChange={(event) => updateChapter(index, { isPreview: event.target.checked })} />
                        Extrait
                      </label>
                    </div>
                    <label className="block space-y-2">
                      <span className="text-xs font-semibold uppercase text-zinc-400">Description du chapitre</span>
                      <textarea value={chapter.description ?? ""} onChange={(event) => updateChapter(index, { description: event.target.value })} rows={2} className="w-full rounded-[8px] border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-300" />
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-zinc-400">Audio</label>
                        <input type="file" accept="audio/*" onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          if (file) void uploadFile(file, "audio", "chapter-audio", index);
                          event.currentTarget.value = "";
                        }} />
                        <TextField label="Clé S3 audio" value={chapter.audioKey ?? ""} onChange={(value) => updateChapter(index, { audioKey: value })} />
                        <TextField label="URL audio" value={chapter.audioUrl} onChange={(value) => updateChapter(index, { audioUrl: value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-zinc-400">Couverture de chapitre</label>
                        <input type="file" accept="image/*" onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          if (file) void uploadFile(file, "image", "chapter-cover", index);
                          event.currentTarget.value = "";
                        }} />
                        <TextField label="Clé S3 couverture" value={chapter.coverKey ?? ""} onChange={(value) => updateChapter(index, { coverKey: value })} />
                        <TextField label="URL couverture" value={chapter.coverUrl ?? ""} onChange={(value) => updateChapter(index, { coverUrl: value })} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-zinc-400">Catégories</label>
                <select
                  multiple
                  value={formData.categories}
                  onChange={(event) => setField("categories", Array.from(event.target.selectedOptions).map((option) => option.value))}
                  className="w-full rounded-[8px] border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-300"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-[8px] border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:text-white">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting || Boolean(uploading)} className="rounded-[8px] bg-brand-300 px-4 py-2 text-sm font-bold text-black shadow-glow transition hover:bg-brand-200 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface TextFieldProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const TextField = ({ label, value, onChange, placeholder, required }: TextFieldProps) => (
  <label className="block space-y-2">
    <span className="text-xs font-semibold uppercase text-zinc-400">{label}</span>
    <input
      required={required}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-[8px] border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-brand-300"
    />
  </label>
);

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const NumberField = ({ label, value, onChange }: NumberFieldProps) => (
  <label className="block space-y-2">
    <span className="text-xs font-semibold uppercase text-zinc-400">{label}</span>
    <input
      type="number"
      min={1}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full rounded-[8px] border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-300"
    />
  </label>
);

export default AdminAudiobookTable;
