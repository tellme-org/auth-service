import { Controller } from '@nestjs/common'; 
import { SignupDto } from './dto/signupDto';
import { SigninDto } from './dto/signinDto';
import { AuthService } from './auth.service';
import { ResetPasswordDemandDto } from './dto/resetPasswordDemandDto';
import { ResetPasswordConfirmationDto } from './dto/resetPasswordConfirmationDto';
import { DeleteAccounDto } from './dto/deleteAccounDto';

import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService : AuthService){}

    @MessagePattern('ping') 
    async ping(@Payload() _payload) {
        return "Pong";
    }
    @MessagePattern('signup') 
    async signup(@Payload() signupDto: SignupDto) {
        return this.authService.signup(signupDto);
    }

    @MessagePattern('signin')
    async signin(@Payload() signinDto: SigninDto) {
        return this.authService.signin(signinDto);
    } 

    @MessagePattern('reset-password-demand')
    async resetPasswordDemand(@Payload() resetPasswordDemandDto: ResetPasswordDemandDto) {
        return this.authService.resetPasswordDemand(resetPasswordDemandDto);
    } 
    
  @MessagePattern('reset-password-confirmation')
  async resetPasswordConfirmation(@Payload() resetPasswordConfirmationDto: ResetPasswordConfirmationDto) {
        return this.authService.resetPasswordConfirmation(resetPasswordConfirmationDto);
    } 

    @MessagePattern('delete-account') 
    async deleteAccount(@Payload() payload: { userId: number; deleteAccounDto: DeleteAccounDto }) {
      const { userId, deleteAccounDto } = payload;
        return this.authService.deleteAccount(userId, deleteAccounDto);
    }

    @MessagePattern('validate-user') 
    async validateUser(@Payload() payload: { email: string }) {
      const { email } = payload; 
        return this.authService.validateUser(email);
    }
}
