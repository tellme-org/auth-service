import { Injectable } from '@nestjs/common';
import { ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common/exceptions";
import { SignupDto } from './dto/signupDto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from "bcrypt";
import * as speakeasy from "speakeasy";
import { JwtService } from '@nestjs/jwt';
import { MailerService } from 'src/mailer/mailer.service';
import { SigninDto } from './dto/signinDto';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDemandDto } from './dto/resetPasswordDemandDto';
import { ResetPasswordConfirmationDto } from './dto/resetPasswordConfirmationDto';
import { DeleteAccounDto } from './dto/deleteAccounDto';


@Injectable()
export class AuthService {
    constructor( 
        private readonly prismaService : PrismaService,
        private readonly mailerService : MailerService,
        private readonly JwtService : JwtService,
        private readonly configService : ConfigService
    ) {}
    async signup(signupDto: SignupDto) {
        const { email, password, username} = signupDto;
        // Check if user is already registered
        const user = await this.prismaService.user.findUnique({where : {email}})
        if (user) return new ConflictException("User already exists");
        // Hash the password
        const hash = await bcrypt.hash(password, 10);
        // Register user
        await this.prismaService.user.create({
            data : { email, username, password : hash}
        });
        // Send a confirmation email
        await this.mailerService.sendSignupConfirmation(email);
        return { data : `User successfully created` };
    }

    async signin(signinDto: SigninDto) {
        const { email, password} = signinDto;
        // Check if user is already registered
        const user = await this.prismaService.user.findUnique({
            where: { email }
        });
        if (!user) return new NotFoundException("User not found");
        // Compare password
        const match = await bcrypt.compare(password, user.password);
        if(!match) return new UnauthorizedException("Password does not match");
        // Returns a jwt token
        const payload = {
            sub : user.userId,
            email : user.email
        }
        const token = this.JwtService.sign(payload, {
            expiresIn : this.configService.get("JWT_EXPIRES_IN"),
            secret : this.configService.get("SECRET_KEY"),
        });
        return {
            token, user : {
                username : user.username, 
                email : user.email, 
            }
        };
    }

    async resetPasswordDemand(resetPasswordDemandDto: ResetPasswordDemandDto) {
        const { email, password} = resetPasswordDemandDto;
        const user = await this.prismaService.user.findUnique({ where: { email } });
        if (!user) return new NotFoundException("User not found");
        const code = speakeasy.totp({
            secret : this.configService.get("OTP_SECRET_CODE"),
            digits : 5,
            step : this.configService.get("OTP_STEP_TIME"), // Time step in seconds
            encoding : "base32",
        });
        const url = `${this.configService.get("HOST")}:${this.configService.get("API_GATEWAY_PORT")}/auth/reset-password-confirmation`;
        await this.mailerService.sendResetPassword(email, url, code);
        return { data: "Reset password mail has been sent" };
    }
    
    async resetPasswordConfirmation(resetPasswordConfirmationDto: ResetPasswordConfirmationDto) {
        const { code, email, password} = resetPasswordConfirmationDto;
        const user = await this.prismaService.user.findUnique({ where: { email } });
        if (!user) return new NotFoundException("User not found");
        const match = speakeasy.totp.verify({
            secret : this.configService.get("OTP_SECRET_CODE"),
            token : code,
            digits : 5,
            step : this.configService.get("OTP_STEP_TIME"), // Time step in seconds
            encoding : "base32",
        });
        if(!match) return new UnauthorizedException("Invalid/expired token");
        const hash = await bcrypt.hash(password, 10);
        await this.prismaService.user.update({
            where : {email}, data : {password: hash}
        });
        return { data : "Password updated" };
    }

    async deleteAccount(userId: number, deleteAccounDto: DeleteAccounDto) {
        const { password } = deleteAccounDto;
        const user = await this.prismaService.user.findUnique({ where: { userId } });
        if (!user) return new NotFoundException("User not found");
        const match = await bcrypt.compare(password, user.password);
        if (!match) return new UnauthorizedException("Password does not match");
        await this.prismaService.user.delete({
            where : { userId }
        });
        return { data : "User successfully deleted" };
    }

    async validateUser(email: string) { 
        return await this.prismaService.user.findUnique({ where: { email: email } });
    }
}
