import { Component } from '@angular/core';

@Component({
  selector: 'app-typing-indicator',
  template: `
    <div class="msg-enter flex items-center gap-2.5">
      <div class="surface-inset rounded-2xl rounded-tl-md px-4 py-3 inline-flex items-center gap-2">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="text-xs text-faint ml-1">Assistant is thinking</span>
      </div>
    </div>
  `,
})
export class TypingIndicatorComponent {}
