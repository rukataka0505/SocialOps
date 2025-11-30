"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

interface TaskSubmissionSectionProps {
    url?: string;
    onSubmitUrl: (url: string) => void;
    isPending: boolean;
}

export function TaskSubmissionSection({
    url: initialUrl,
    onSubmitUrl,
    isPending
}: TaskSubmissionSectionProps) {
    const [url, setUrl] = useState(initialUrl || "");

    return (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="font-medium mb-3 flex items-center gap-2">
                <LinkIcon className="h-4 w-4" /> 提出物
            </h3>
            <div className="flex gap-2">
                <Input
                    placeholder="Google Drive / Figma URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={() => onSubmitUrl(url)}
                />
                {initialUrl && (
                    <Button variant="outline" size="icon" onClick={() => window.open(initialUrl, '_blank')}>
                        <ExternalLink className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
