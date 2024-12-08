import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern } from "@nestjs/microservices";
import { of } from "rxjs";
import { delay } from "rxjs/operators";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern({ cmd: "ping" })
  ping(_: any) {
    return of("pong").pipe(delay(1000));
  }
}
