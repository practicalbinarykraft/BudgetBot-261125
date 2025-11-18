// Category Tool Handler - create new transaction category
import { storage } from '../../storage';
import { ToolResult } from '../tool-types';

export async function handleCreateCategory(
  userId: number,
  params: {
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    color?: string;
  }
): Promise<ToolResult> {
  try {
    // Validate required params
    if (!params.name || !params.type) {
      return {
        success: false,
        error: 'Missing required parameters: name and type'
      };
    }

    // Create category
    const category = await storage.createCategory({
      userId,
      name: params.name,
      type: params.type,
      icon: params.icon || 'Tag',
      color: params.color || '#3b82f6'
    });
    
    return {
      success: true,
      data: {
        id: category.id,
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color
      },
      message: `Category "${category.name}" created successfully`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create category'
    };
  }
}
