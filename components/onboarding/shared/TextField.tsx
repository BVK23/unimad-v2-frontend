import React from "react";

type CommonProps = {
  label?: string;
  helperText?: string;
  invalid?: boolean;
  containerClassName?: string;
};

type InputProps = CommonProps & React.InputHTMLAttributes<HTMLInputElement> & { multiline?: false };

type TextAreaProps = CommonProps & React.TextareaHTMLAttributes<HTMLTextAreaElement> & { multiline: true };

type TextFieldProps = InputProps | TextAreaProps;

const baseField =
  "w-full rounded-[10px] border bg-white px-4 py-3 text-sm text-[#0C0F1A] placeholder:text-[#8896A8] focus:outline-none focus:border-[#346DE0] focus:ring-1 focus:ring-[#346DE0]/30";

export default function TextField(props: TextFieldProps) {
  const { label, helperText, invalid, containerClassName = "" } = props;
  const borderClass = invalid ? "border-rose-300" : "border-[rgba(12,15,26,0.07)]";

  if (props.multiline) {
    const {
      multiline: _multiline,
      label: _label,
      helperText: _helperText,
      invalid: _invalid,
      containerClassName: _containerClassName,
      ...rest
    } = props;
    void _multiline;
    void _label;
    void _helperText;
    void _invalid;
    void _containerClassName;
    return (
      <label className={`flex flex-col gap-1.5 ${containerClassName}`}>
        {label ? <span className="text-xs font-medium text-[#4A5568]">{label}</span> : null}
        <textarea {...rest} className={`${baseField} ${borderClass} ${rest.className ?? ""}`} />
        {helperText ? <span className={`text-xs ${invalid ? "text-rose-600" : "text-[#8896A8]"}`}>{helperText}</span> : null}
      </label>
    );
  }

  const {
    multiline: _multiline,
    label: _label,
    helperText: _helperText,
    invalid: _invalid,
    containerClassName: _containerClassName,
    ...rest
  } = props;
  void _multiline;
  void _label;
  void _helperText;
  void _invalid;
  void _containerClassName;
  return (
    <label className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label ? <span className="text-xs font-medium text-[#4A5568]">{label}</span> : null}
      <input {...rest} className={`${baseField} ${borderClass} ${rest.className ?? ""}`} />
      {helperText ? <span className={`text-xs ${invalid ? "text-rose-600" : "text-[#8896A8]"}`}>{helperText}</span> : null}
    </label>
  );
}
