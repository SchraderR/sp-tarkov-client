import log from 'electron-log';
import { getDataSource } from '../data-source';
import { InstanceEntity } from '../entity/Instance';
import { IsNull , Not } from 'typeorm';

export async function createInstance(sptRootDirectory: string, isActive = false): Promise<InstanceEntity | null> {
  try {
    const dataSource = await getDataSource();
    const instance = dataSource.manager.create(InstanceEntity, {
      sptRootDirectory,
      isActive,
      modCache: [],
    });

    const savedInstance = await dataSource.manager.save(InstanceEntity, instance);
    log.info(`Instance created with ID: ${savedInstance.id}`);

    return savedInstance;
  } catch (error) {
    log.error('Error creating instance:', error);
    return null;
  }
}

export async function getAllInstances(): Promise<InstanceEntity[]> {
  try {
    const dataSource = await getDataSource();
    const ttt = await dataSource.manager.find(InstanceEntity, { where: { id: Not(IsNull()) }});

    return await dataSource.manager.find(InstanceEntity, { where: { id: Not(IsNull()) }});
  } catch (error) {
    log.error('Error getting all instances:', error);
    return [];
  }
}

export async function findInstanceById(id: number): Promise<InstanceEntity | null> {
  try {
    const dataSource = await getDataSource();
    return await dataSource.manager.findOneBy(InstanceEntity, { id });
  } catch (error) {
    log.error(`Error finding instance by ID ${id}:`, error);
    return null;
  }
}

export async function findInstanceByPath(sptRootDirectory: string): Promise<InstanceEntity | null> {
  try {
    const dataSource = await getDataSource();
    return await dataSource.manager.findOneBy(InstanceEntity, { sptRootDirectory });
  } catch (error) {
    log.error(`Error finding instance by path ${sptRootDirectory}:`, error);
    return null;
  }
}

export async function removeInstance(id: number): Promise<void> {
  try {
    const dataSource = await getDataSource();
    await dataSource.manager.delete(InstanceEntity, id);
    log.info(`Instance ${id} removed`);
  } catch (error) {
    log.error(`Error removing instance ${id}:`, error);
  }
}

export async function getInstanceProperty<K extends keyof Omit<InstanceEntity, 'id'>>(instanceId: number, property: K): Promise<InstanceEntity[K] | null> {
  try {
    const instance = await findInstanceById(instanceId);
    return instance ? instance[property] : null;
  } catch (error) {
    log.error(`Error getting instance property ${String(property)} for instance ${instanceId}:`, error);
    return null;
  }
}

export async function setInstanceProperty<K extends keyof Omit<InstanceEntity, 'id'>>(instanceId: number, property: K, value: InstanceEntity[K]): Promise<boolean> {
  try {
    const dataSource = await getDataSource();
    const instance = await findInstanceById(instanceId);

    if (!instance) {
      log.error(`Instance ${instanceId} not found to update`);
      return false;
    }

    await dataSource.manager.update(InstanceEntity, { id: instanceId }, { [property]: value });

    log.info(`Instance ${instanceId} property ${String(property)} updated`);
    return true;
  } catch (error) {
    log.error(`Error setting instance property ${String(property)} for instance ${instanceId}:`, error);
    return false;
  }
}

export async function addModToInstanceCache(instanceId: number, modId: number): Promise<boolean> {
  try {
    const modCache = await getInstanceProperty(instanceId, "modCache") ?? [];
    if (modCache.includes(modId)) {
      log.warn(`Mod ${modId} already in cache for instance ${instanceId}`);
      return false;
    }

    modCache.push(modId);
    return await setInstanceProperty(instanceId, 'modCache', modCache);
  } catch (error) {
    log.error(`Error adding mod to instance cache ${instanceId}:`, error);
    return false;
  }
}

export async function removeModFromInstanceCache(instanceId: number, modId: number): Promise<boolean> {
  try {
    const modCache = await getInstanceProperty(instanceId, "modCache") ?? [];
    const filteredCache = modCache.filter(id => id !== modId);

    if (filteredCache.length === modCache.length) {
      log.warn(`Mod ${modId} not found in cache for instance ${instanceId}`);
      return false;
    }

    return await setInstanceProperty(instanceId, 'modCache', filteredCache);
  } catch (error) {
    log.error(`Error removing mod from instance cache ${instanceId}:`, error);
    return false;
  }
}

export async function setInstanceActive(instanceId: number): Promise<boolean> {
  try {
    const dataSource = await getDataSource();
    const instance = await findInstanceById(instanceId);
    if (!instance) {
      log.error(`Instance ${instanceId} not found`);
      return false;
    }

    await dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.update(InstanceEntity, { id: Not(IsNull()) }, { isActive: false });
      await transactionalEntityManager.update(InstanceEntity, { id: instanceId }, { isActive: true });
    });

    log.info(`Instance with Id: ${instanceId} InstancePath: ${instance.sptRootDirectory} set as active`);
    return true;
  } catch (error) {
    log.error(`Error setting active instance ${instanceId}:`, error);
    return false;
  }
}


