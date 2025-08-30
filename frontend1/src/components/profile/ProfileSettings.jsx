import React, { useState } from "react";

const ProfileSettings = ({ me, onSave }) => {
  const [form, setForm] = useState({
    name: me?.name || "",
    email: me?.email || "",
    bio: me?.bio || "",
    password: "",
    password2: "",
  });
  const [saving, setSaving] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave?.(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
    >
      <div>
        <label className="block text-sm text-gray-600 mb-1">Name</label>
        <input
          className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          name="name"
          value={form.name}
          onChange={change}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input
          className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          name="email"
          type="email"
          value={form.email}
          onChange={change}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Bio</label>
        <textarea
          className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          rows={4}
          name="bio"
          value={form.bio}
          onChange={change}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            New Password
          </label>
          <input
            className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
            name="password"
            type="password"
            value={form.password}
            onChange={change}
            placeholder="Leave blank to keep current"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Confirm</label>
          <input
            className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
            name="password2"
            type="password"
            value={form.password2}
            onChange={change}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

export default ProfileSettings;
