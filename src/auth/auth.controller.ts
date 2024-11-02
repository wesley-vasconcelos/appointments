import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/auth/')
  auth(@Body() auth: LoginDto) {
    return this.authService.auth(auth);
  }

  @Post('/auth/register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }
}
