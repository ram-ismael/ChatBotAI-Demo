import { installTestStorage } from '../testing/storage';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageComposerComponent } from './message-composer.component';
import { ChatService } from '../core/services/chat.service';
import { ConnectionService } from '../core/services/connection.service';

describe('message composer', () => {
  beforeEach(() => { installTestStorage(); window.localStorage.clear(); TestBed.configureTestingModule({ imports: [MessageComposerComponent] }); });
  afterEach(() => { TestBed.resetTestingModule(); window.localStorage.clear(); });

  it('preserves Shift+Enter and composition input, but sends on Enter', () => {
    const fixture = TestBed.createComponent(MessageComposerComponent);
    fixture.detectChanges();
    const input: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    const send = vi.spyOn(TestBed.inject(ChatService), 'sendMessage').mockReturnValue(true);
    input.value = 'Hello';
    const newline = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true, cancelable: true });
    input.dispatchEvent(newline);
    expect(newline.defaultPrevented).toBe(false);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }));
    expect(send).not.toHaveBeenCalled();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(send).toHaveBeenCalledWith('Hello');
    expect(input.value).toBe('');
  });

  it('allows local replies during an outage and keeps rejected drafts', () => {
    const fixture = TestBed.createComponent(MessageComposerComponent);
    TestBed.inject(ConnectionService).simulateOutage();
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('[title="Send message"]');
    expect(button.disabled).toBe(false);
    const input: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    input.value = 'Keep this draft';
    vi.spyOn(TestBed.inject(ChatService), 'sendMessage').mockReturnValue(false);
    button.click();
    expect(input.value).toBe('Keep this draft');
  });
});
