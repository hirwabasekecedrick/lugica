import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service.js';
import { LoginPayload } from '../user/user.types.js';
import { RegisterDTO } from './dto/register.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private userService: UserService){
    }
    async Login(payload: LoginPayload){

        return 0;
    }
    async Register(payload: RegisterDTO){

    }

}
