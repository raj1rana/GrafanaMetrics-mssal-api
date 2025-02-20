import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen w-full p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-foreground">
          Grafana JSON API Data Source
        </h1>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This data source is configured and ready to accept Grafana queries.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Query Endpoint</h3>
              <code className="bg-muted p-2 rounded block">
                POST /api/query
              </code>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Variable Support</h3>
              <code className="bg-muted p-2 rounded block">
                POST /api/tag-keys
                POST /api/tag-values
              </code>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Health Check</h3>
              <code className="bg-muted p-2 rounded block">
                GET /api/health
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
