import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  Users,
} from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import {
  getPharmacies,
  createPharmacy,
  updatePharmacy,
  deletePharmacy,
  type PharmacyData,
} from "@/services/api";

interface FormState {
  name: string;
  address: string;
  phone: string;
  email: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

const emptyForm: FormState = {
  name: "",
  address: "",
  phone: "",
  email: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

export default function PharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<PharmacyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PharmacyData | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPharmacies();
      setPharmacies(result.pharmacies);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setShowModal(true);
  };

  const handleEdit = (p: PharmacyData) => {
    setEditing(p);
    setForm({
      name: p.name,
      address: p.address ?? "",
      phone: p.phone ?? "",
      email: p.email ?? "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questa farmacia?")) return;
    setDeleting(id);
    try {
      await deletePharmacy(id);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore");
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await updatePharmacy(editing.id, {
          name: form.name,
          address: form.address || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
        });
      } else {
        await createPharmacy({
          name: form.name,
          address: form.address || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          adminName: form.adminName,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-card bg-accent-purple/10">
            <Building2 className="h-5 w-5 text-accent-purple" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Farmacie</h1>
            <p className="text-sm text-text-dim">
              {pharmacies.length} farmaci{pharmacies.length === 1 ? "a" : "e"} registrat{pharmacies.length === 1 ? "a" : "e"}
            </p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-btn bg-accent-purple px-4 py-2 text-sm font-semibold text-white hover:bg-accent-purple/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuova Farmacia
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent-purple" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-20 text-accent-red text-sm">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pharmacies.map((p) => (
            <SectionCard key={p.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{p.name}</h3>
                  {p.address && <p className="text-xs text-text-dim mt-0.5">{p.address}</p>}
                  {p.phone && <p className="text-xs text-text-dim">{p.phone}</p>}
                  {p.email && <p className="text-xs text-text-dim">{p.email}</p>}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(p)}
                    className="p-1.5 rounded-btn text-text-dim hover:text-accent-purple hover:bg-accent-purple/10 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="p-1.5 rounded-btn text-text-dim hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                  >
                    {deleting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-card/50">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Users className="h-3.5 w-3.5" />
                  {p.userCount ?? 0} utenti
                </div>
                <span className="text-xs text-text-dim">
                  Creata {formatDate(p.createdAt)}
                </span>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg rounded-card border border-border-card bg-bg-card p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-text-primary">
                {editing ? "Modifica Farmacia" : "Nuova Farmacia"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-btn text-text-dim hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-text-muted mb-1 block">Nome Farmacia *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="es. Farmacia Centrale"
                  className="w-full rounded-btn border border-border-card bg-white/[0.03] px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-muted mb-1 block">Indirizzo</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Via Roma 1, Milano"
                  className="w-full rounded-btn border border-border-card bg-white/[0.03] px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1 block">Telefono</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="02 1234567"
                    className="w-full rounded-btn border border-border-card bg-white/[0.03] px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1 block">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="info@farmacia.it"
                    className="w-full rounded-btn border border-border-card bg-white/[0.03] px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/30"
                  />
                </div>
              </div>

              {/* Admin user fields (only on create) */}
              {!editing && (
                <>
                  <div className="border-t border-border-card pt-4 mt-4">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                      Primo utente Admin
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted mb-1 block">Nome Admin *</label>
                    <input
                      value={form.adminName}
                      onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
                      placeholder="Mario Rossi"
                      className="w-full rounded-btn border border-border-card bg-white/[0.03] px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted mb-1 block">Email Admin *</label>
                    <input
                      type="email"
                      value={form.adminEmail}
                      onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                      placeholder="admin@farmacia.it"
                      className="w-full rounded-btn border border-border-card bg-white/[0.03] px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-text-muted mb-1 block">Password Admin *</label>
                    <input
                      type="password"
                      value={form.adminPassword}
                      onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))}
                      placeholder="Minimo 6 caratteri"
                      className="w-full rounded-btn border border-border-card bg-white/[0.03] px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim/50 focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/30"
                    />
                  </div>
                </>
              )}

              {formError && (
                <div className="flex items-center gap-2 text-xs text-accent-red bg-accent-red/10 rounded-btn px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-btn border border-border-card px-4 py-2 text-sm font-medium text-text-muted hover:bg-white/[0.03] transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || !form.name || (!editing && (!form.adminName || !form.adminEmail || !form.adminPassword))}
                  className="flex items-center gap-2 rounded-btn bg-accent-purple px-4 py-2 text-sm font-semibold text-white hover:bg-accent-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? "Salva" : "Crea Farmacia"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
