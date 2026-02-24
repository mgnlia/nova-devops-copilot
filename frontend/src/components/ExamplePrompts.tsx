"use client";

interface ExamplePromptsProps {
  onSelect: (prompt: string) => void;
}

const EXAMPLES = [
  { icon: "🐳", label: "Deploy to ECS", prompt: "Deploy my Node.js app to AWS ECS with Fargate, ALB, and auto-scaling" },
  { icon: "⚡", label: "Serverless API", prompt: "Create a serverless REST API with Lambda, API Gateway, and DynamoDB" },
  { icon: "☸️", label: "Kubernetes on EKS", prompt: "Deploy my microservices to EKS with Helm charts and horizontal pod autoscaling" },
  { icon: "🗄️", label: "RDS + App", prompt: "Set up a production PostgreSQL RDS with read replicas and automated backups" },
  { icon: "🔄", label: "CI/CD Pipeline", prompt: "Create a GitHub Actions CI/CD pipeline with testing, staging, and production environments" },
  { icon: "🌐", label: "Static Site CDN", prompt: "Deploy a React app to S3 + CloudFront with custom domain and SSL" },
];

export default function ExamplePrompts({ onSelect }: ExamplePromptsProps) {
  return (
    <div className="mb-6">
      <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-medium">
        Try an example
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => onSelect(ex.prompt)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-aws-orange/30 transition-all text-left group"
          >
            <span className="text-lg">{ex.icon}</span>
            <span className="text-xs text-gray-300 group-hover:text-white transition-colors">
              {ex.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
