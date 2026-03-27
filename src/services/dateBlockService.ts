import { supabase } from '../lib/supabase';
import {
  DateBlockDTO,
  DateBlockRangeDTO,
  DateBlockRuleDTO,
  PropertyDateOverrideDTO,
  CreateDateBlockRequest,
  CreatePropertyOverrideRequest,
  DesignationDTO,
} from '../types';

class DateBlockService {
  async getDesignations(): Promise<DesignationDTO[]> {
    const { data, error } = await supabase
      .from('designation_master')
      .select('*')
      .eq('is_active', true)
      .order('level', { ascending: true });

    if (error) throw error;

    return (data || []).map((d) => ({
      id: d.id,
      designationName: d.designation_name,
      designationCode: d.designation_code,
      level: d.level,
      description: d.description || '',
      isActive: d.is_active,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  async createDesignation(
    name: string,
    code: string,
    level: number,
    description: string
  ): Promise<DesignationDTO> {
    const { data, error } = await supabase
      .from('designation_master')
      .insert({
        designation_name: name,
        designation_code: code,
        level,
        description,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      designationName: data.designation_name,
      designationCode: data.designation_code,
      level: data.level,
      description: data.description || '',
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async updateDesignation(
    id: string,
    updates: Partial<{
      name: string;
      code: string;
      level: number;
      description: string;
      isActive: boolean;
    }>
  ): Promise<DesignationDTO> {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.name) dbUpdates.designation_name = updates.name;
    if (updates.code) dbUpdates.designation_code = updates.code;
    if (updates.level !== undefined) dbUpdates.level = updates.level;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('designation_master')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      designationName: data.designation_name,
      designationCode: data.designation_code,
      level: data.level,
      description: data.description || '',
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async getDateBlocks(): Promise<DateBlockDTO[]> {
    const { data, error } = await supabase
      .from('date_blocks')
      .select(`
        *,
        date_block_ranges(*),
        date_block_rules(*, asset_types(*))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((block) => ({
      id: block.id,
      blockName: block.block_name,
      description: block.description || '',
      createdBy: block.created_by,
      isActive: block.is_active,
      createdAt: block.created_at,
      updatedAt: block.updated_at,
      ranges: (block.date_block_ranges || []).map((r: any) => ({
        id: r.id,
        blockId: r.block_id,
        startDate: r.start_date,
        endDate: r.end_date,
        createdAt: r.created_at,
      })),
      rules: (block.date_block_rules || []).map((r: any) => ({
        id: r.id,
        blockId: r.block_id,
        assetTypeId: r.asset_type_id,
        roomTypeIds: r.room_type_ids || [],
        allowedDesignations: r.allowed_designations || [],
        createdAt: r.created_at,
        assetType: r.asset_types
          ? {
              id: r.asset_types.id,
              name: r.asset_types.name,
              category: r.asset_types.category,
            }
          : undefined,
      })),
    }));
  }

  async createDateBlock(request: CreateDateBlockRequest): Promise<DateBlockDTO> {
    const { data: blockData, error: blockError } = await supabase
      .from('date_blocks')
      .insert({
        block_name: request.blockName,
        description: request.description,
        is_active: true,
      })
      .select()
      .single();

    if (blockError) throw blockError;

    const ranges = request.ranges.map((r) => ({
      block_id: blockData.id,
      start_date: r.startDate,
      end_date: r.endDate,
    }));

    const { error: rangeError } = await supabase
      .from('date_block_ranges')
      .insert(ranges);

    if (rangeError) throw rangeError;

    const rules = request.rules.map((r) => ({
      block_id: blockData.id,
      asset_type_id: r.assetTypeId,
      room_type_ids: r.roomTypeIds,
      allowed_designations: r.allowedDesignations,
    }));

    const { error: ruleError } = await supabase
      .from('date_block_rules')
      .insert(rules);

    if (ruleError) throw ruleError;

    return this.getDateBlockById(blockData.id);
  }

  async getDateBlockById(id: string): Promise<DateBlockDTO> {
    const { data, error } = await supabase
      .from('date_blocks')
      .select(`
        *,
        date_block_ranges(*),
        date_block_rules(*, asset_types(*)),
        property_date_overrides(*, properties(id, name, code))
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Date block not found');

    return {
      id: data.id,
      blockName: data.block_name,
      description: data.description || '',
      createdBy: data.created_by,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      ranges: (data.date_block_ranges || []).map((r: any) => ({
        id: r.id,
        blockId: r.block_id,
        startDate: r.start_date,
        endDate: r.end_date,
        createdAt: r.created_at,
      })),
      rules: (data.date_block_rules || []).map((r: any) => ({
        id: r.id,
        blockId: r.block_id,
        assetTypeId: r.asset_type_id,
        roomTypeIds: r.room_type_ids || [],
        allowedDesignations: r.allowed_designations || [],
        createdAt: r.created_at,
        assetType: r.asset_types
          ? {
              id: r.asset_types.id,
              name: r.asset_types.name,
              category: r.asset_types.category,
            }
          : undefined,
      })),
      overrides: (data.property_date_overrides || []).map((o: any) => ({
        id: o.id,
        blockId: o.block_id,
        propertyId: o.property_id,
        overrideType: o.override_type,
        allowedDesignations: o.allowed_designations || [],
        roomTypeIds: o.room_type_ids || [],
        createdAt: o.created_at,
        property: o.properties
          ? {
              id: o.properties.id,
              name: o.properties.name,
              code: o.properties.code,
            }
          : undefined,
      })),
    };
  }

  async updateDateBlock(
    id: string,
    updates: Partial<{ blockName: string; description: string; isActive: boolean }>
  ): Promise<DateBlockDTO> {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.blockName) dbUpdates.block_name = updates.blockName;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { error } = await supabase
      .from('date_blocks')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;

    return this.getDateBlockById(id);
  }

  async deleteDateBlock(id: string): Promise<void> {
    const { error } = await supabase.from('date_blocks').delete().eq('id', id);

    if (error) throw error;
  }

  async createPropertyOverride(request: CreatePropertyOverrideRequest): Promise<PropertyDateOverrideDTO> {
    const { data, error } = await supabase
      .from('property_date_overrides')
      .insert({
        block_id: request.blockId,
        property_id: request.propertyId,
        override_type: request.overrideType,
        allowed_designations: request.allowedDesignations,
        room_type_ids: request.roomTypeIds,
      })
      .select('*, properties(id, name, code)')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      blockId: data.block_id,
      propertyId: data.property_id,
      overrideType: data.override_type,
      allowedDesignations: data.allowed_designations || [],
      roomTypeIds: data.room_type_ids || [],
      createdAt: data.created_at,
      property: data.properties
        ? {
            id: data.properties.id,
            name: data.properties.name,
            code: data.properties.code,
          }
        : undefined,
    };
  }

  async deletePropertyOverride(id: string): Promise<void> {
    const { error } = await supabase
      .from('property_date_overrides')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getActiveBlocksForDateRange(startDate: string, endDate: string): Promise<DateBlockDTO[]> {
    const { data, error } = await supabase
      .from('date_blocks')
      .select(`
        *,
        date_block_ranges!inner(*),
        date_block_rules(*, asset_types(*)),
        property_date_overrides(*, properties(id, name, code))
      `)
      .eq('is_active', true)
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`, {
        referencedTable: 'date_block_ranges',
      });

    if (error) throw error;

    return (data || []).map((block) => ({
      id: block.id,
      blockName: block.block_name,
      description: block.description || '',
      createdBy: block.created_by,
      isActive: block.is_active,
      createdAt: block.created_at,
      updatedAt: block.updated_at,
      ranges: (block.date_block_ranges || []).map((r: any) => ({
        id: r.id,
        blockId: r.block_id,
        startDate: r.start_date,
        endDate: r.end_date,
        createdAt: r.created_at,
      })),
      rules: (block.date_block_rules || []).map((r: any) => ({
        id: r.id,
        blockId: r.block_id,
        assetTypeId: r.asset_type_id,
        roomTypeIds: r.room_type_ids || [],
        allowedDesignations: r.allowed_designations || [],
        createdAt: r.created_at,
        assetType: r.asset_types
          ? {
              id: r.asset_types.id,
              name: r.asset_types.name,
              category: r.asset_types.category,
            }
          : undefined,
      })),
      overrides: (block.property_date_overrides || []).map((o: any) => ({
        id: o.id,
        blockId: o.block_id,
        propertyId: o.property_id,
        overrideType: o.override_type,
        allowedDesignations: o.allowed_designations || [],
        roomTypeIds: o.room_type_ids || [],
        createdAt: o.created_at,
        property: o.properties
          ? {
              id: o.properties.id,
              name: o.properties.name,
              code: o.properties.code,
            }
          : undefined,
      })),
    }));
  }

  async getBlockingRulesForProperty(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    blocks: DateBlockDTO[];
    affectedRoomTypeIds: string[];
    hasOverride: boolean;
  }> {
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('asset_type_id')
      .eq('id', propertyId)
      .maybeSingle();

    if (propertyError) throw propertyError;
    if (!property) throw new Error('Property not found');

    const blocks = await this.getActiveBlocksForDateRange(startDate, endDate);

    const relevantBlocks = blocks.filter((block) => {
      const hasMatchingRule = block.rules?.some((rule) => rule.assetTypeId === property.asset_type_id);
      const hasOverride = block.overrides?.some((override) => override.propertyId === propertyId);
      return hasMatchingRule || hasOverride;
    });

    const affectedRoomTypeIds = new Set<string>();
    let hasOverride = false;

    relevantBlocks.forEach((block) => {
      const override = block.overrides?.find((o) => o.propertyId === propertyId);

      if (override) {
        hasOverride = true;
        if (override.overrideType === 'BLOCK') {
          override.roomTypeIds.forEach((id) => affectedRoomTypeIds.add(id));
        }
      } else {
        block.rules
          ?.filter((rule) => rule.assetTypeId === property.asset_type_id)
          .forEach((rule) => {
            rule.roomTypeIds.forEach((id) => affectedRoomTypeIds.add(id));
          });
      }
    });

    return {
      blocks: relevantBlocks,
      affectedRoomTypeIds: Array.from(affectedRoomTypeIds),
      hasOverride,
    };
  }

  async checkUserEligibility(
    userId: string,
    propertyId: string,
    roomTypeId: string,
    startDate: string,
    endDate: string
  ): Promise<{ canBook: boolean; reason?: string }> {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('designation_id, designation_master(level)')
      .eq('id', userId)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) return { canBook: false, reason: 'User not found' };

    const { blocks, affectedRoomTypeIds } = await this.getBlockingRulesForProperty(
      propertyId,
      startDate,
      endDate
    );

    if (blocks.length === 0) {
      return { canBook: true };
    }

    if (!affectedRoomTypeIds.includes(roomTypeId)) {
      return { canBook: true };
    }

    if (!user.designation_id) {
      return {
        canBook: false,
        reason: 'You need a designation assigned to book during special dates',
      };
    }

    const userLevel = user.designation_master?.level || 999;

    for (const block of blocks) {
      const override = block.overrides?.find((o) => o.propertyId === propertyId);

      if (override) {
        if (override.overrideType === 'ALLOW') {
          if (override.allowedDesignations.includes(user.designation_id)) {
            return { canBook: true };
          }
        } else if (override.overrideType === 'BLOCK') {
          if (
            override.roomTypeIds.includes(roomTypeId) &&
            !override.allowedDesignations.includes(user.designation_id)
          ) {
            return {
              canBook: false,
              reason: `This room type is reserved during ${block.blockName}`,
            };
          }
        }
      } else {
        const matchingRule = block.rules?.find(
          (rule) =>
            rule.roomTypeIds.includes(roomTypeId) &&
            rule.allowedDesignations.length > 0
        );

        if (matchingRule) {
          if (!matchingRule.allowedDesignations.includes(user.designation_id)) {
            return {
              canBook: false,
              reason: `This room type is reserved for senior officials during ${block.blockName}`,
            };
          }
        }
      }
    }

    return { canBook: true };
  }
}

export const dateBlockService = new DateBlockService();
