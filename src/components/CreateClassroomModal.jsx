import { useMemo, useState } from 'react';

const initialState = {
  name: '',
  subject: '',
  description: '',
};

export default function CreateClassroomModal({ isOpen, onClose, onCreate }) {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => formData.name.trim() && formData.subject.trim() && !submitting,
    [formData.name, formData.subject, submitting]
  );

  if (!isOpen) {
    return null;
  }

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Classroom name is required';
    }

    if (!formData.subject.trim()) {
      nextErrors.subject = 'Subject is required';
    }

    if (formData.name.trim().length > 100) {
      nextErrors.name = 'Classroom name must be 100 characters or fewer';
    }

    if (formData.subject.trim().length > 60) {
      nextErrors.subject = 'Subject must be 60 characters or fewer';
    }

    if (formData.description.trim().length > 500) {
      nextErrors.description = 'Description must be 500 characters or fewer';
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      await onCreate({
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        description: formData.description.trim(),
      });
      setFormData(initialState);
      onClose();
    } catch (error) {
      setErrors({ form: error.message || 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Create Classroom</h2>
          <p className="text-sm text-slate-600 mt-1">Set up a new classroom and share its room code with students.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="classroom-name" className="block text-sm font-medium text-slate-700 mb-1">Classroom Name</label>
            <input
              id="classroom-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600"
              maxLength={100}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="classroom-subject" className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input
              id="classroom-subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600"
              maxLength={60}
            />
            {errors.subject && <p className="text-xs text-red-600 mt-1">{errors.subject}</p>}
          </div>

          <div>
            <label htmlFor="classroom-description" className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
            <textarea
              id="classroom-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600 min-h-24"
              maxLength={500}
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!canSubmit}>
              {submitting ? 'Creating...' : 'Create Classroom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
