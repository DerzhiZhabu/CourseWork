export interface ILoginSend {
  login: string;
  password: string;
}

export interface IRegisterSend {
  login: string;
  password: string;
}

export interface ILoginReceive {
  message: string
  user:{
    accesToken: string;
  }
}

export interface INewOrderReceive {
  message: string
  user:{
    result: string;
  }
}

export interface INewServiceReceive {
  message: string
  user:{
    result: string;
  }
}

export interface IUpdateServiceReceive {
  message: string
  user:{
    result: string;
  }
}

export interface INewWorkerReceive {
  message: string
  user:{
    result: string;
  }
}

export interface IUpdateWorkerReceive {
  message: string
  user:{
    result: string;
  }
}

export interface INewOrderSend {
  token: string;
  name: string;
  client: string;
  phone: string;
  type: string;
}

export interface IUpdateOrderSend {
  token: string;
  name: string;
  client: string;
  phone: string;
  type: string;
  sost: string;
  number:number;
}

export interface IUpdateOrdersReceive {
  message: string;
  user:{
    result: IOrder[]
  };
}

export interface INewServiceSend {
  token: string;
  name: string;
  price1: number;
  price2: number;
}

export interface IUpdateServiceSend {
  token: string;
  id: number;
  name: string;
  price1: number;
  price2: number;
}

export interface INewWorkerSend {
  token: string;
  name: string;
  surname: string;
  patronimic: string;
  procent: number;
  sost: boolean;
}

export interface IUpdateWorkerSend {
  token: string;
  id: number;
  name: string;
  surname: string;
  patronimic: string;
  sost: boolean;
}

export interface IAccessTokenSend {
  token: string;
}

export interface IOrdersSend {
  token: string;
  page: number;
  size: number;
  mode?: string;
}

export interface IProfileReceive {
  message: string;
  user: {
    id: number;
    login: string;
    acces: string;
  };
}

export interface IChangePasswordSend {
  token: string;
  oldPassword: string;
  newPassword: string;
}

export interface IChangePasswordReceive {
  message: string;
}

export interface IChildUser {
  login: string;
  acces: string;
}

export interface ILoadChildUsersReceive {
  message: string;
  user: {
    result: IChildUser[];
  };
}

export interface INewChildUserSend {
  token: string;
  login: string;
  password: string;
  acces: string;
}

export interface INewChildUserReceive {
  message: string;
  user: IChildUser;
}

export interface IOrder {
  number: number;
  name: string;
  client: string;
  date: string;
  sost: string;
  phone: string;
  date_closed: string | { Time: string; Valid: boolean } | null;
  type: string;
  price: number;
}

export interface IWorkers {
  id: number;
  name: string;
  surname: string;
  patronimic :string;
  procent: number;
  status: boolean;
}

export interface ILoadWorkersReceive {
  message: string;
  user:{
    result: IWorkers[]
  };
}

export interface ILoadWorkerServiceSend {
  token: string;
  id: number;
  dateStart: string;
  dateEnd: string;
}

export interface IStatsSend {
  token: string;
  dateStart: string;
  dateEnd: string;
}

export interface IStatsSalaryRow {
  id: number;
  name: string;
  surname: string;
  patronimic: string;
  procent: number;
  status: boolean;
  salary: number;
}

export interface IStatsServiceRow {
  id: number;
  name: string;
  income: number;
}

export interface IStatsReceive {
  message: string;
  user: {
    salaryRows: IStatsSalaryRow[];
    salaryTotal: number;
    salaryAverage: number;
    serviceRows: IStatsServiceRow[];
    servicesTotal: number;
    revenueTotal: number;
    netProfit: number;
  };
}

export interface IWorkerServices {
  sname: string;
  number: number;
  summary: number;
}

export interface ILoadWorkerServicesReceive {
  message: string;
  user:{
    result: IWorkerServices[]
    total: number;
  };
}

export interface ILoadWorkersSend {
  token: string;
}

export interface IService {
  id: number;
  name: string;
  price1: number;
  price2: number;
}

export interface IOrdersReceive {
  message: string;
  user:{
    orders: IOrder[];
    total: number;
    page: number;
    size: number;
  };
}

export interface IServiceInOrder {
  osid: number;
  sid: number;
  sname: string;
  samount: number;
  price: number;
  sost: number;
  worker: string;
}

export interface IAddServicesInOrderLoadSend {
  token: string;
  number: number;
}

export interface IAddServiceInOrderLoad {
  id: number;
  sname: string;
  price: number;
  sost: number;
  editable: number;
}

export interface IAddServiceSend{
  token: string;
  number: number;
  id: number;
  price: number;
  col: number;
}

export interface IAddServiceResieve{
  message: string;
  user:{
    result: string;
  }
}

export interface ICompleteOrderServiceSend {
  token: string;
  osid: number;
  workerId: number;
}

export interface ICompleteOrderServiceReceive {
  message: string;
  user:{
    result: string;
  }
}

export interface IUndoOrderServiceSend {
  token: string;
  osid: number;
}

export interface IUndoOrderServiceReceive {
  message: string;
  user:{
    result: string;
  }
}

export interface IAddServicesInOrderLoadReceive {
  message: string;
  user:{
    services: IAddServiceInOrderLoad[];
  };
}

export interface IServicesInOrderReceive {
  message: string;
  user:{
    services: IServiceInOrder[];
  };
}

export interface IServicesInOrderSend {
  token: string;
  number: number;
}


export interface IServicesReceive {
  message: string;
  user:{
    services: IService[]
  };
}

export interface IRegisterReceive {
  message: string
  user:{
    acces_token: string;
  }
}
