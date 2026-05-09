type PublicResumeErrorProps = {
  title: string;
  message: string;
  status?: number;
};

const PublicResumeError = ({ title, message, status }: PublicResumeErrorProps) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-600 mb-1">{message}</p>
        {status != null ? (
          <p className="text-xs text-slate-400" role="status">
            Code {status}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default PublicResumeError;
