export function FormInput({ label, ...props }) { return <label className="form-field"><span>{label}</span><input {...props} /></label>; }
