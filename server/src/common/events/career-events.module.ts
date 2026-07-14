import { Global, Module } from '@nestjs/common';
import { EventEmitter } from 'node:events';

@Global()
@Module({
  providers: [{ provide: EventEmitter, useValue: new EventEmitter() }],
  exports: [EventEmitter],
})
export class CareerEventsModule {}
