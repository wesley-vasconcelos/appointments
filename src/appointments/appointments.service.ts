import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Appointment } from './appointments.schema';
import { Model } from 'mongoose';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto, userId: string) {
    const appointmentDate = new Date(createAppointmentDto.date);
    
    const currentDate = new Date();
    if (appointmentDate < currentDate) {
      throw new BadRequestException(
        'Não é possível agendar um compromisso em datas passadas.'
      );
    }
  
    const roundedAppointmentDate = new Date(Math.ceil(appointmentDate.getTime() / (30 * 60 * 1000)) * (30 * 60 * 1000));
    
    const startDate = new Date(roundedAppointmentDate);
    const endDate = new Date(roundedAppointmentDate);
    endDate.setMinutes(endDate.getMinutes() + 30);
  
    const overlappingAppointment = await this.appointmentModel.findOne({
      user: userId,
      date: { $gte: startDate, $lt: endDate },
    }); 
  
    if (overlappingAppointment) {
      throw new BadRequestException(
        'Já existe um compromisso agendado para este intervalo de tempo.'
      );
    }
  
    try {
      const appointment = await this.appointmentModel.create({
        ...createAppointmentDto,
        user: userId,
      });
      return appointment;
    } catch (error) {
      console.log('Error creating appointment:', error);
      throw error;
    }
  }
  
  
  async findAll() {
    try {
      return await this.appointmentModel.find().exec();
    } catch (error) {
      console.log('Error retrieving appointments:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const appointment = await this.appointmentModel.findById(id).exec();
      if (!appointment) {
        throw new NotFoundException(`Appointment #${id} not found`);
      }
      return appointment;
    } catch (error) {
      console.log('Error finding appointment:', error);
      throw error;
    }
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    const updatedDate = new Date(updateAppointmentDto.date);
    const currentDate = new Date();
    
    if (updatedDate < currentDate) {
      throw new BadRequestException('Não é possível agendar um compromisso em datas passadas.');
    }
  
    const roundedAppointmentDate = new Date(Math.ceil(updatedDate.getTime() / (30 * 60 * 1000)) * (30 * 60 * 1000));
    
    const startDate = new Date(roundedAppointmentDate);
    const endDate = new Date(roundedAppointmentDate);
    endDate.setMinutes(endDate.getMinutes() + 30);
  
    const overlappingAppointment = await this.appointmentModel.findOne({
      _id: { $ne: id },
      date: { $gte: startDate, $lt: endDate },
    });
  
    if (overlappingAppointment) {
      throw new BadRequestException('Já existe um compromisso agendado para este intervalo de tempo.');
    }
  
    try {
      const updatedAppointment = await this.appointmentModel
        .findByIdAndUpdate(id, updateAppointmentDto, { new: true })
        .exec();
  
      if (!updatedAppointment) {
        throw new NotFoundException(`Appointment #${id} not found`);
      }
      return updatedAppointment;
    } catch (error) {
      console.log('Error updating appointment:', error);
      throw error;
    }
  }
  

  async remove(id: string) {
    try {
      const deletedAppointment = await this.appointmentModel
        .findByIdAndDelete(id)
        .exec();
      if (!deletedAppointment) {
        throw new NotFoundException(`Appointment #${id} not found`);
      }
      return deletedAppointment;
    } catch (error) {
      console.log('Error deleting appointment:', error);
      throw error;
    }
  }
}
