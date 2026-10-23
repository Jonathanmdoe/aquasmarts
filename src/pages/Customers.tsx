import { useMemo, useState } from "react";
import { Building2, Mail, MapPin, Phone, Plus, Search, Trash2, User, Users, X } from "lucide-react";
import { useFarmCustomers, useDeleteFarmCustomer, useSaveFarmCustomer } from "@/hooks/useOperations";
import { useUserRole } from "@/hooks/useUserRole";

const input = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30";

export default function Customers() {
  const { isOwner, isManager } = useUserRole();
  const { data: customers = [], isLoading } = useFarmCustomers();
  const saveCustomer = useSaveFarmCustomer();
  const removeCustomer = useDeleteFarmCustomer();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState({ name: "", customer_type: "individual", phone: "", email: "", location: "", notes: "" });
  const canManage = isOwner || isManager;
  const filtered = useMemo(() => customers.filter((c: any) => `${c.name} ${c.phone} ${c.email ?? ""} ${c.location ?? ""}`.toLowerCase().includes(search.toLowerCase())), [customers, search]);
  const open = (customer?: any) => {
    setEdit(customer ?? null);
    setForm(customer ? { name: customer.name, customer_type: customer.customer_type, phone: customer.phone, email: customer.email ?? "", location: customer.location ?? "", notes: customer.notes ?? "" } : { name: "", customer_type: "individual", phone: "", email: "", location: "", notes: "" });
    setShowForm(true);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await saveCustomer.mutateAsync({ ...form, id: edit?.id }); setShowForm(false); }
    catch { /* mutation shows an error toast */ }
  };
  const iconFor = (type: string) => type === "company" ? Building2 : type === "group" ? Users : User;

  return <div className="min-h-screen pb-6">
    <header className="gradient-ocean px-4 pt-10 pb-6 text-primary-foreground"><div className="flex justify-between items-center gap-2"><div><h1 className="text-xl font-bold font-display">Customers</h1><p className="text-xs text-primary-foreground/70">Farm buyer directory</p></div>{canManage && <button onClick={() => open()} className="rounded-xl bg-primary-foreground/15 px-3 py-2 text-xs font-semibold flex gap-1 items-center"><Plus className="w-4 h-4"/> Add</button>}</div>
      <div className="relative mt-4"><Search className="absolute left-3 top-2.5 w-4 h-4 text-primary-foreground/50"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers" className="w-full rounded-xl bg-primary-foreground/10 py-2.5 pl-9 pr-3 text-sm text-primary-foreground placeholder:text-primary-foreground/50 outline-none"/></div>
    </header>
    <main className="px-4 -mt-3 relative space-y-3">
      {isLoading ? <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground">Loading customers…</div> : filtered.length === 0 ? <div className="rounded-2xl bg-card p-8 text-center shadow-card"><Users className="mx-auto mb-2 h-8 w-8 text-primary"/><p className="text-sm font-semibold">{search ? "No matching customers" : "No customers saved yet"}</p><p className="mt-1 text-xs text-muted-foreground">You can save customer details and select them when recording a sale.</p></div> : filtered.map((customer: any) => { const Icon = iconFor(customer.customer_type); return <article key={customer.id} className="rounded-2xl bg-card p-4 shadow-card"><div className="flex justify-between gap-3"><div className="flex items-start gap-3 min-w-0"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="w-4 h-4"/></div><div className="min-w-0"><h2 className="text-sm font-semibold truncate">{customer.name}</h2><p className="text-[10px] capitalize text-muted-foreground">{customer.customer_type}</p></div></div>{canManage && <div className="flex gap-1"><button onClick={() => open(customer)} className="rounded-lg bg-muted px-2 py-1 text-[10px]">Edit</button><button onClick={() => removeCustomer.mutate(customer.id)} aria-label="Delete customer" className="rounded-lg bg-destructive/10 p-2 text-destructive"><Trash2 className="w-3.5 h-3.5"/></button></div>}</div><div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 text-xs text-muted-foreground"><p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5"/>{customer.phone}</p>{customer.email && <p className="flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5 shrink-0"/>{customer.email}</p>}{customer.location && <p className="flex items-center gap-1.5 col-span-2"><MapPin className="h-3.5 w-3.5"/>{customer.location}</p>}</div>{customer.notes && <p className="border-t border-border/60 mt-3 pt-2 text-xs text-muted-foreground">{customer.notes}</p>}</article>; })}
    </main>
    {showForm && <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-end justify-center"><form onSubmit={submit} className="bg-card w-full max-w-md rounded-t-3xl p-4 pb-8 space-y-3 max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-center"><h2 className="font-bold">{edit ? "Edit customer" : "New customer"}</h2><button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-muted p-2"><X className="w-4 h-4"/></button></div><label className="block text-xs">Name<input required maxLength={120} className={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label><label className="block text-xs">Type<select className={input} value={form.customer_type} onChange={e => setForm({ ...form, customer_type: e.target.value })}><option value="individual">Individual</option><option value="group">Group / Cooperative</option><option value="company">Company</option></select></label><label className="block text-xs">Phone<input required maxLength={30} className={input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}/></label><label className="block text-xs">Email<input type="email" maxLength={255} className={input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/></label><label className="block text-xs">Location<input maxLength={150} className={input} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}/></label><label className="block text-xs">Notes<textarea maxLength={500} className={input} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}/></label><button disabled={saveCustomer.isPending} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground">{saveCustomer.isPending ? "Saving…" : "Save customer"}</button></form></div>}
  </div>;
}
