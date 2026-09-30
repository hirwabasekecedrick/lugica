"use client";

import React, { useState } from "react";
import { LoadingState, ErrorState } from "@/app/components/ui-states";
import { useCreateUser, useUpdateUser, useUsers } from "@/lib/api/hooks";
import { formatDate, roleLabel } from "@/lib/format";
import { ApiError } from "@/lib/api/errors";
import { useToast } from "@/app/components/ToastProvider";
import type { Role } from "@/lib/api/types";

/**
 * Users and drivers (ADMIN).
 *
 * Built first of the admin sections on purpose: the seed creates no users with
 * Role.DRIVER, so delivery assignment is untestable until a driver exists
 * here. See docs/API-GAPS.md #14.
 */
export default function UsersSection() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const usersQuery = useUsers(page, roleFilter || undefined);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const toast = useToast();

  const [showCreate, setShowCreate] = useState(false);

  const users = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta;
  // GET /users does return totalPages, but Paginated marks it optional because
  // GET /admin/orders omits it (docs/API-GAPS.md #19).
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter((e.target.value || "") as Role | "");
            setPage(1);
          }}
          className="bg-[#131e36] border border-[#263B6A] text-[#EEFABD] text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:border-[#A0D585] cursor-pointer"
        >
          <option value="">All roles</option>
          <option value="CLIENT">Clients</option>
          <option value="DRIVER">Drivers</option>
          <option value="SHOP_MANAGER">Shop managers</option>
          <option value="ADMIN">Admins</option>
        </select>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] rounded-lg text-xs font-bold transition-colors cursor-pointer"
        >
          {showCreate ? "Close" : "New user"}
        </button>
      </div>

      {showCreate && (
        <CreateUserForm
          onSubmit={async (input) => {
            await createUser.mutateAsync(input);
            toast.success("User created", `${input.name} · ${roleLabel(input.role)}`);
          }}
          onError={(message) => toast.error("Could not create user", message)}
          pending={createUser.isPending}
          onDone={() => setShowCreate(false)}
        />
      )}

      {usersQuery.isLoading ? (
        <LoadingState label="Loading users…" />
      ) : usersQuery.isError ? (
        <ErrorState error={usersQuery.error} onRetry={() => usersQuery.refetch()} />
      ) : (
        <div className="overflow-x-auto bg-[#0d1525] border border-[#263B6A] rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#131e36]/70 border-b border-[#263B6A] text-[#6984A9] text-[11px] font-semibold uppercase">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263B6A]/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#131e36]/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">
                    {u.name}
                    {u.licenseNumber && (
                      <span className="block text-[10px] text-[#6984A9] font-mono">
                        {u.licenseNumber}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#6984A9]">{u.email}</td>
                  <td className="py-3 px-4 text-[#6984A9]">{u.phone ?? "—"}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#131e36] border border-[#263B6A] text-[#EEFABD]">
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#6984A9] whitespace-nowrap">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() =>
                        updateUser.mutate(
                          { id: u.id, input: { isActive: !u.isActive } },
                          {
                            onSuccess: () =>
                              toast.success(
                                u.isActive ? "User disabled" : "User enabled",
                                u.name,
                              ),
                            onError: (err) =>
                              toast.error("Could not update user", (err as Error).message),
                          },
                        )
                      }
                      disabled={updateUser.isPending}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold border cursor-pointer disabled:opacity-50 ${
                        u.isActive
                          ? "bg-[#A0D585]/15 text-[#A0D585] border-[#A0D585]/30"
                          : "bg-rose-500/15 text-rose-300 border-rose-400/30"
                      }`}
                    >
                      {u.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#6984A9]">
          <span>
            Page {meta.page} of {totalPages} · {meta.total} users
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] rounded disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 bg-[#131e36] hover:bg-[#263B6A] border border-[#263B6A] rounded disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateUserForm({
  onSubmit,
  onError,
  pending,
  onDone,
}: {
  onSubmit: (input: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: Role;
    licenseNumber?: string;
  }) => Promise<unknown>;
  onError: (message: string) => void;
  pending: boolean;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("DRIVER");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      await onSubmit({
        name,
        email,
        password,
        role,
        phone: phone || undefined,
        licenseNumber: role === "DRIVER" && licenseNumber ? licenseNumber : undefined,
      });
      onDone();
    } catch (err) {
      // Server-side rejection -> toast; the inline box stays for the local
      // password check above.
      onError(
        err instanceof ApiError
          ? (Object.values(err.fieldErrors)[0] ?? err.message)
          : (err as Error).message,
      );
    }
  }

  const inputClass =
    "w-full bg-[#131e36] border border-[#263B6A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#6984A9] outline-none focus:border-[#A0D585]";

  return (
    <form onSubmit={submit} className="bg-[#0d1525] border border-[#263B6A] rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-bold text-white">New user</h3>

      {error && (
        <p className="text-[11px] text-rose-300 border border-rose-400/30 bg-rose-500/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputClass} required />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className={inputClass} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8)" className={inputClass} required minLength={8} />
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputClass}>
          <option value="DRIVER">Driver</option>
          <option value="CLIENT">Client</option>
          <option value="SHOP_MANAGER">Shop manager</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {role === "DRIVER" && (
        <input
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          placeholder="Driving licence number"
          className={inputClass}
        />
      )}

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 bg-[#A0D585] hover:bg-[#EEFABD] text-[#0d1525] rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
