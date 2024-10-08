import { Bot } from "lucide-react";
import React from "react";
export default function BotMessage({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2 ps-4">
        <div className="py-auto">
          <Bot size={32} />
        </div>
      </div>
      <div className="rounded-lg p-4 max-w-[80%] bg-base-700">
      {message.split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line.trim() === '' ? (
              <br />
            ) : (
              <p className="text-sm mb-2">{line}</p>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
