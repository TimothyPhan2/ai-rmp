"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import UserMessage from "./UserMessage"
import BotMessage from "./BotMessage"
import { Send } from "lucide-react"
import { Textarea } from "./ui/textarea"


  export default function Chat(){
    const [messages, setMessages] = useState([
        {
          role: 'assistant',
          content: `Hi! I'm the Rate My Professor support assistant. How can I help you today?`,
        },
      ])
      const messagesEndRef = useRef<HTMLDivElement>(null);

      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      };
    
      useEffect(() => {
        scrollToBottom();
      }, [messages]);
      const [message, setMessage] = useState('')

      const handleMessage = async () =>{
        setMessage('')
        setMessages((messages) => [
          ...messages,
          {role: 'user', content: message},
          {role: 'assistant', content: ''},
        ])
      
        const response = fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([...messages, {role: 'user', content: message}]),
        }).then(async (res) => {
            const reader = res.body?.getReader()
            const decoder = new TextDecoder()
            let result = ''
      
            // Add type annotation here
            return reader?.read().then(async function processText({done, value}: { done: boolean; value?: Uint8Array }): Promise<string> {
              if (done) {
                return Promise.resolve(result)
              }
              const text = decoder.decode(value || new Uint8Array(), {stream: true})
              setMessages((messages) => {
                let lastMessage = messages[messages.length - 1]
                let otherMessages = messages.slice(0, messages.length - 1)
                return [
                  ...otherMessages,
                  {...lastMessage, content: lastMessage.content + text},
                ]
              })
              const res = await reader.read()
                return processText(res)
            })
          })
      }

      const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleMessage();
        }
      };
      return (
        <>
        <div className="flex flex-col h-screen bg-background">
      
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4">
            {messages.map((item, index) =>
              item.role === "user" ? (
                <UserMessage key={index} message={item.content} />
              ) : (
                <BotMessage key={index} message={item.content} />
              )
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="bg-accent-700 border-t p-8 flex items-center gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 pr-12 h-12"
          />
          
          <Button
            type="submit"
            onClick={handleMessage}
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <Send className="w-5 h-5" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
        </>
      )
  }