import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import { getUsers, createUser, updateUser, deleteUser, type UserData } from "@/services/api";

function formatDate(iso: string | null): string {
  if (!iso) return "Mai";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: "viewer",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function openCreate() {
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "viewer" });
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(user: UserData) {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: "", role: user.role });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setFormError(null);

    try {
      if (editingUser) {
        // Update
        const updates: { name?: string; role?: string; password?: string } = {};
        if (formData.name !== editingUser.name) updates.name = formData.name;
        if (formData.role !== editingUser.role) updates.role = formData.role;
        if (formData.password) updates.password = formData.password;

        await updateUser(editingUser.id, updates);
      } else {
        // Create
        await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await deleteUser(id);
      setConfirmDeleteId(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore");
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-accent-blue" />
          <h1 className="text-lg font-semibold text-text-primary">
            Gestione Utenti
          </h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-btn bg-accent-blue px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-blue/90"
        >
          <Plus className="h-4 w-4" />
          Nuovo Utente
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-btn border border-accent-red/30 bg-accent-red/[0.05] px-3 py-2 text-xs text-accent-red">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-card text-left">
                <th className="px-4 py-3 text-xs font-medium text-text-dim">Nome</th>
                <th className="px-4 py-3 text-xs font-medium text-text-dim">Email</th>
                <th className="px-4 py-3 text-xs font-medium text-text-dim">Ruolo</th>
                <th className="px-4 py-3 text-xs font-medium text-text-dim">Ultimo accesso</th>
                <th className="px-4 py-3 text-xs font-medium text-text-dim text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border-card/50 last:border-0">
                  <td className="px-4 py-3 text-text-primary font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-text-muted">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        user.role === "admin"
                          ? "bg-accent-purple/15 text-accent-purple"
                          : user.role === "operator"
                            ? "bg-accent-green/15 text-accent-green"
                            : "bg-accent-blue/15 text-accent-blue"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : user.role === "operator" ? "Operatore" : "Viewer"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-dim font-mono">
                    {formatDate(user.lastLogin)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {confirmDeleteId === user.id ? (
                        <>
                          <span className="text-xs text-text-muted mr-2">Eliminare?</span>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={deleting}
                            className="rounded-btn bg-accent-red px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-red/90 disabled:opacity-50"
                          >
                            {deleting ? "..." : "Si"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-btn border border-border-card px-2.5 py-1 text-xs text-text-muted hover:text-text-primary"
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => openEdit(user)}
                            className="rounded-btn p-1.5 text-text-dim hover:bg-white/[0.05] hover:text-text-primary transition-colors"
                            title="Modifica"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(user.id)}
                            className="rounded-btn p-1.5 text-text-dim hover:bg-accent-red/10 hover:text-accent-red transition-colors"
                            title="Elimina"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-card border border-border-card bg-bg-card p-6 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">
              {editingUser ? "Modifica Utente" : "Nuovo Utente"}
            </h2>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Nome
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-btn border border-border-card bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingUser}
                className="w-full rounded-btn border border-border-card bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue disabled:opacity-50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Password{editingUser && " (lascia vuoto per non cambiare)"}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? "Invariata" : "Min. 6 caratteri"}
                className="w-full rounded-btn border border-border-card bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-accent-blue"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">
                Ruolo
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full rounded-btn border border-border-card bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue"
              >
                <option value="viewer">Viewer</option>
                <option value="operator">Operatore</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {formError && (
              <p className="text-xs text-accent-red">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-btn border border-border-card px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-btn bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:bg-accent-blue/90 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingUser ? "Salva" : "Crea"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
